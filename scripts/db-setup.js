// Creates the tables (schema.sql) in the database at DATABASE_URL. Safe to run
// again. With --demo, an empty database is also filled with demo data.
// Usage: npm run db:setup [-- --demo]
import { readFileSync } from 'node:fs';
import { openDb } from '../db.js';
import { seed } from '../js/seed.js';

const db = openDb();
try {
  await db.sql.unsafe(readFileSync(new URL('../schema.sql', import.meta.url), 'utf8'));
  console.log('Schema is up to date.');
  if (process.argv.includes('--demo')) {
    if ((await db.all()).staff.length) console.log('Staff already exist, so no demo data was added.');
    else { await db.apply({ upsert: seed() }); console.log('Demo data added.'); }
  }
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
} finally {
  await db.close();
}
