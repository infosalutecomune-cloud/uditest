/**
 * Script per inizializzare le credenziali admin nel database.
 * Esegui con: node scripts/init-admin.mjs
 *
 * Questo script crea l'utente admin con email e password fornite.
 * Eseguilo una sola volta al primo avvio, oppure per cambiare la password.
 */
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '..', '.env') });

// Credenziali da impostare
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'ordini@acusticadimaio.it';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Uditest@26';
const ADMIN_NOME = process.env.ADMIN_NOME || 'Acustica Di Maio';

async function main() {
  try {
    const { drizzle } = await import('drizzle-orm/mysql2');
    const { eq } = await import('drizzle-orm');
    const bcrypt = await import('bcryptjs');

    const db = drizzle(process.env.DATABASE_URL);

    // Import schema dinamico
    const schemaModule = await import('../drizzle/schema.js').catch(() =>
      import('../drizzle/schema.ts')
    );
    const { adminUsers } = schemaModule;

    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

    await db.insert(adminUsers)
      .values({ email: ADMIN_EMAIL, passwordHash, nome: ADMIN_NOME })
      .onDuplicateKeyUpdate({ set: { passwordHash, nome: ADMIN_NOME } });

    console.log(`✅ Admin creato/aggiornato: ${ADMIN_EMAIL}`);
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log(`   Accedi su: /admin/login`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Errore:', err.message);
    process.exit(1);
  }
}

main();
