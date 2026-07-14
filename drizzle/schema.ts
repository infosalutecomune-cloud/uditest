import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Tabella leads: raccoglie i dati degli utenti che completano un test
 * e sbloccano il referto PDF. Include consenso marketing opzionale.
 */
export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 128 }),
  cognome: varchar("cognome", { length: 128 }),
  email: varchar("email", { length: 320 }).notNull(),
  cellulare: varchar("cellulare", { length: 32 }),
  consensoPrivacy: boolean("consensoPrivacy").notNull().default(false),
  consensoMarketing: boolean("consensoMarketing").notNull().default(false),
  /** Consenso cessione dati a centri acustici partner per lead generation */
  consensoCessione: boolean("consensoCessione").notNull().default(false),
  /** Tipo di test completato: 'vocale', 'tonale', 'completo' */
  tipoTest: varchar("tipoTest", { length: 32 }),
  /** Risultato sintetico del test (es. "Norma - 92%") */
  risultatoSintetico: text("risultatoSintetico"),
  /** Città di residenza */
  citta: varchar("citta", { length: 128 }),
  /** Provincia (sigla 2 lettere, es. "RM") */
  provincia: varchar("provincia", { length: 4 }),
  /** IP address per deduplicazione */
  ipAddress: varchar("ipAddress", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

/**
 * Tabella admin_users: credenziali per il pannello admin indipendente da Manus OAuth.
 * Ogni istanza white-label può avere le proprie credenziali.
 */
export const adminUsers = mysqlTable("admin_users", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  nome: varchar("nome", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  lastLoginAt: timestamp("lastLoginAt"),
});

export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = typeof adminUsers.$inferInsert;

/**
 * Tabella app_config: configurazione white-label dell'app.
 * Permette di cambiare logo, nome, contatti senza toccare il codice.
 */
export const appConfig = mysqlTable("app_config", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 64 }).notNull().unique(),
  value: text("value"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AppConfig = typeof appConfig.$inferSelect;
