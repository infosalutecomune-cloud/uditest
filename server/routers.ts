import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { SignJWT, jwtVerify } from "jose";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getLeads, getLeadsStats, saveLead, verifyAdminCredentials, upsertAdminUser, getAppConfig, setAppConfigBulk } from "./db";
import { notifyOwner } from "./_core/notification";

// JWT secret per il token admin (separato dal JWT Manus)
const ADMIN_JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ? `admin_${process.env.JWT_SECRET}` : "admin_uditest_secret_2026"
);
const ADMIN_COOKIE = "uditest_admin_session";

// Helper: verifica il token admin dalla request
async function getAdminFromRequest(req: { cookies?: Record<string, string> }) {
  try {
    const token = req.cookies?.[ADMIN_COOKIE];
    if (!token) return null;
    const { payload } = await jwtVerify(token, ADMIN_JWT_SECRET);
    return payload as { adminId: number; email: string; nome: string | null };
  } catch {
    return null;
  }
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  /**
   * Salva un lead: utente che ha completato il test e vuole sbloccare il referto PDF.
   */
  leads: router({
    save: publicProcedure
      .input(z.object({
        nome: z.string().optional(),
        cognome: z.string().optional(),
        email: z.string().email("Email non valida"),
        cellulare: z.string().optional(),
        consensoPrivacy: z.boolean().refine(v => v === true, "Consenso privacy obbligatorio"),
        consensoMarketing: z.boolean().default(false),
        consensoCessione: z.boolean().default(false),
        tipoTest: z.string().optional(),
        risultatoSintetico: z.string().optional(),
        citta: z.string().optional(),
        provincia: z.string().max(4).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const ipAddress =
          (ctx.req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
          ctx.req.socket?.remoteAddress ||
          null;

        const leadId = await saveLead({
          nome: input.nome ?? null,
          cognome: input.cognome ?? null,
          email: input.email,
          cellulare: input.cellulare ?? null,
          consensoPrivacy: input.consensoPrivacy,
          consensoMarketing: input.consensoMarketing,
          consensoCessione: input.consensoCessione,
          tipoTest: input.tipoTest ?? null,
          risultatoSintetico: input.risultatoSintetico ?? null,
          citta: input.citta ?? null,
          provincia: input.provincia ?? null,
          ipAddress: ipAddress ?? null,
        });

        const nomeCompleto = [input.nome, input.cognome].filter(Boolean).join(" ") || "Anonimo";
        const yn = (v: boolean) => v ? "✅ Sì" : "❌ No";
        await notifyOwner({
          title: `Nuovo lead UdiTest: ${nomeCompleto}`,
          content:
            `**Nuovo referto sbloccato**\n\n` +
            `**Nome:** ${nomeCompleto}\n` +
            `**Email:** ${input.email}\n` +
            `**Cellulare:** ${input.cellulare || "—"}\n` +
            `**Città:** ${input.citta || "—"}\n` +
            `**Provincia:** ${input.provincia || "—"}\n` +
            `**Test eseguito:** ${input.tipoTest || "—"}\n` +
            `**Risultato:** ${input.risultatoSintetico || "—"}\n\n` +
            `**Consenso privacy:** ${yn(input.consensoPrivacy)}\n` +
            `**Consenso marketing (Acustica Di Maio):** ${yn(input.consensoMarketing)}\n` +
            `**Consenso cessione a centri partner:** ${yn(input.consensoCessione)}\n\n` +
            `**IP:** ${ipAddress || "—"}`,
        });

        return { success: true, leadId };
      }),
  }),

  /**
   * Admin auth indipendente da Manus OAuth.
   * Usa JWT separato con cookie httpOnly.
   */
  adminAuth: router({
    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        const admin = await verifyAdminCredentials(input.email, input.password);
        if (!admin) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Credenziali non valide' });
        }

        // Genera JWT admin con scadenza 7 giorni
        const token = await new SignJWT({
          adminId: admin.id,
          email: admin.email,
          nome: admin.nome,
        })
          .setProtectedHeader({ alg: 'HS256' })
          .setExpirationTime('7d')
          .setIssuedAt()
          .sign(ADMIN_JWT_SECRET);

        // Imposta cookie httpOnly sicuro
        ctx.res.cookie(ADMIN_COOKIE, token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 giorni
          path: '/',
        });

        return { success: true, nome: admin.nome, email: admin.email };
      }),

    logout: publicProcedure
      .mutation(({ ctx }) => {
        ctx.res.clearCookie(ADMIN_COOKIE, { path: '/' } as Parameters<typeof ctx.res.clearCookie>[1]);
        return { success: true };
      }),

    me: publicProcedure
      .query(async ({ ctx }) => {
        const admin = await getAdminFromRequest(ctx.req as { cookies?: Record<string, string> });
        return admin;
      }),
  }),

  /**
   * Procedure admin per visualizzare e scaricare i lead.
   * Protette dal token admin (non da Manus OAuth).
   */
  admin: router({
    getLeads: publicProcedure
      .input(z.object({
        search: z.string().optional(),
        tipoTest: z.string().optional(),
        consensoMarketing: z.boolean().optional(),
        consensoCessione: z.boolean().optional(),
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
        limit: z.number().min(1).max(500).default(100),
        offset: z.number().min(0).default(0),
      }))
      .query(async ({ input, ctx }) => {
        const admin = await getAdminFromRequest(ctx.req as { cookies?: Record<string, string> });
        if (!admin) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Accesso riservato agli amministratori' });
        }
        return getLeads(input);
      }),

    getStats: publicProcedure
      .query(async ({ ctx }) => {
        const admin = await getAdminFromRequest(ctx.req as { cookies?: Record<string, string> });
        if (!admin) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Accesso riservato agli amministratori' });
        }
        return getLeadsStats();
      }),

    getConfig: publicProcedure
      .query(async ({ ctx }) => {
        const admin = await getAdminFromRequest(ctx.req as { cookies?: Record<string, string> });
        if (!admin) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Accesso riservato agli amministratori' });
        }
        return getAppConfig();
      }),

    saveConfig: publicProcedure
      .input(z.record(z.string(), z.string()))
      .mutation(async ({ input, ctx }) => {
        const admin = await getAdminFromRequest(ctx.req as { cookies?: Record<string, string> });
        if (!admin) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Accesso riservato agli amministratori' });
        }
        await setAppConfigBulk(input);
        return { success: true };
      }),

    // Endpoint per inizializzare le credenziali admin (usato solo al primo setup)
    initAdmin: publicProcedure
      .input(z.object({
        setupKey: z.string(),
        email: z.string().email(),
        password: z.string().min(8),
        nome: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // Chiave di setup per sicurezza (evita accessi non autorizzati)
        const expectedKey = process.env.JWT_SECRET
          ? `setup_${process.env.JWT_SECRET.slice(0, 8)}`
          : 'setup_uditest2026';
        if (input.setupKey !== expectedKey) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Chiave di setup non valida' });
        }
        await upsertAdminUser(input.email, input.password, input.nome);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
