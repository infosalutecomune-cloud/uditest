import { and, count, desc, eq, gte, like, lte, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { adminUsers, appConfig, InsertAdminUser, InsertLead, InsertUser, leads, users } from "../drizzle/schema";
import { ENV } from './_core/env';
import bcrypt from 'bcryptjs';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Recupera la lista dei lead con filtri opzionali (per admin).
 */
export async function getLeads(opts?: {
  search?: string;
  tipoTest?: string;
  consensoMarketing?: boolean;
  consensoCessione?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };

  const conditions = [];

  if (opts?.search) {
    const s = `%${opts.search}%`;
    conditions.push(
      or(
        like(leads.email, s),
        like(leads.nome, s),
        like(leads.cognome, s),
        like(leads.cellulare, s),
        like(leads.citta, s),
        like(leads.provincia, s),
      )
    );
  }
  if (opts?.tipoTest) conditions.push(eq(leads.tipoTest, opts.tipoTest));
  if (opts?.consensoMarketing !== undefined) conditions.push(eq(leads.consensoMarketing, opts.consensoMarketing));
  if (opts?.consensoCessione !== undefined) conditions.push(eq(leads.consensoCessione, opts.consensoCessione));
  if (opts?.dateFrom) conditions.push(gte(leads.createdAt, opts.dateFrom));
  if (opts?.dateTo) conditions.push(lte(leads.createdAt, opts.dateTo));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [items, totalRows] = await Promise.all([
    db.select().from(leads)
      .where(where)
      .orderBy(desc(leads.createdAt))
      .limit(opts?.limit ?? 100)
      .offset(opts?.offset ?? 0),
    db.select({ total: count() }).from(leads).where(where),
  ]);

  return { items, total: totalRows[0]?.total ?? 0 };
}

/**
 * Statistiche aggregate dei lead (per dashboard admin).
 */
export async function getLeadsStats() {
  const db = await getDb();
  if (!db) return { total: 0, marketing: 0, cessione: 0, vocale: 0, tonale: 0 };

  const [total, marketing, cessione, vocale, tonale] = await Promise.all([
    db.select({ n: count() }).from(leads),
    db.select({ n: count() }).from(leads).where(eq(leads.consensoMarketing, true)),
    db.select({ n: count() }).from(leads).where(eq(leads.consensoCessione, true)),
    db.select({ n: count() }).from(leads).where(eq(leads.tipoTest, 'vocale')),
    db.select({ n: count() }).from(leads).where(eq(leads.tipoTest, 'tonale')),
  ]);

  return {
    total: total[0]?.n ?? 0,
    marketing: marketing[0]?.n ?? 0,
    cessione: cessione[0]?.n ?? 0,
    vocale: vocale[0]?.n ?? 0,
    tonale: tonale[0]?.n ?? 0,
  };
}

/**
 * Salva un lead (utente che ha completato il test e vuole sbloccare il referto).
 * Restituisce l'ID del lead inserito.
 */
export async function saveLead(lead: InsertLead): Promise<number | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot save lead: database not available");
    return null;
  }

  try {
    const result = await db.insert(leads).values(lead);
    // MySQL returns insertId in the result metadata
    const insertId = (result as unknown as [{ insertId: number }])[0]?.insertId ?? null;
    return insertId;
  } catch (error) {
    console.error("[Database] Failed to save lead:", error);
    throw error;
  }
}

// ─────────────────────────────────────────────
// ADMIN AUTH (indipendente da Manus OAuth)
// ─────────────────────────────────────────────

/**
 * Crea o aggiorna un admin user con password hashata.
 */
export async function upsertAdminUser(email: string, password: string, nome?: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database non disponibile");

  const passwordHash = await bcrypt.hash(password, 12);
  await db.insert(adminUsers)
    .values({ email, passwordHash, nome: nome ?? null })
    .onDuplicateKeyUpdate({ set: { passwordHash, nome: nome ?? null } });
}

/**
 * Verifica le credenziali admin. Restituisce l'admin se valido, null altrimenti.
 */
export async function verifyAdminCredentials(email: string, password: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(adminUsers).where(eq(adminUsers.email, email)).limit(1);
  const admin = result[0];
  if (!admin) return null;

  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) return null;

  // Aggiorna lastLoginAt
  await db.update(adminUsers).set({ lastLoginAt: new Date() }).where(eq(adminUsers.id, admin.id));

  return { id: admin.id, email: admin.email, nome: admin.nome };
}

// ─────────────────────────────────────────────
// APP CONFIG (white-label)
// ─────────────────────────────────────────────

/**
 * Legge tutta la configurazione dell'app come oggetto chiave-valore.
 */
export async function getAppConfig(): Promise<Record<string, string>> {
  const db = await getDb();
  if (!db) return {};

  const rows = await db.select().from(appConfig);
  return Object.fromEntries(rows.map(r => [r.key, r.value ?? '']));
}

/**
 * Salva un valore di configurazione.
 */
export async function setAppConfig(key: string, value: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database non disponibile");

  await db.insert(appConfig)
    .values({ key, value })
    .onDuplicateKeyUpdate({ set: { value } });
}

/**
 * Salva più valori di configurazione in una sola operazione.
 */
export async function setAppConfigBulk(config: Record<string, string>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database non disponibile");

  for (const [key, value] of Object.entries(config)) {
    await db.insert(appConfig)
      .values({ key, value })
      .onDuplicateKeyUpdate({ set: { value } });
  }
}
