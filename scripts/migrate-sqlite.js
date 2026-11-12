// One-off copy of an existing SQLite database (the pre-Postgres version of the
// app) into the database at DATABASE_URL. Run `npm run db:setup` first. Rows
// whose id already exists are updated, so it is safe to run again.
// Usage: npm run db:migrate-sqlite [-- path/to/punchcard.db]
import { DatabaseSync } from 'node:sqlite';
import { openDb } from '../db.js';

const file = process.argv[2] || 'data/punchcard.db';
const lite = new DatabaseSync(file, { readOnly: true });
const db = openDb();
const rows = q => lite.prepare(q).all();

try {
  const staff = rows('SELECT * FROM staff ORDER BY rowid').map(r => ({ ...r, active: !!r.active }));
  const shifts = rows('SELECT * FROM shifts').map(r => ({ ...r, staffId: r.staff_id }));
  const entries = rows('SELECT * FROM entries').map(r => ({
    id: r.id, staffId: r.staff_id, in: r.clock_in, out: r.clock_out, breaks: JSON.parse(r.breaks), breakEdited: !!r.break_edited,
  }));
  await db.apply({ upsert: { staff, shifts, entries } });

  const notifications = rows('SELECT * FROM notifications ORDER BY id');
  const admins = rows('SELECT * FROM admins ORDER BY id');
  await db.sql.begin(async tx => {
    // Only copy the log once: it has no natural key to update by.
    if (notifications.length && !(await tx`SELECT 1 FROM notifications LIMIT 1`).length) {
      await tx`INSERT INTO notifications ${tx(notifications.map(({ id, ...n }) => n))}`;
    }
    for (const a of admins) {
      await tx`INSERT INTO admins (email, name, password, created_at) VALUES (${a.email}, ${a.name}, ${a.password}, ${a.created_at})
        ON CONFLICT (lower(email)) DO UPDATE SET name = excluded.name, password = excluded.password`;
    }
  });
  console.log(`Copied ${staff.length} staff, ${shifts.length} shifts, ${entries.length} entries, ` +
    `${notifications.length} notifications and ${admins.length} admins from ${file}. Admins sign in again.`);
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
} finally {
  lite.close();
  await db.close();
}
