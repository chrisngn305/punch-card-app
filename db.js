// Postgres storage (Supabase in production) via the `postgres` driver. The
// schema lives in schema.sql; run `npm run db:setup` once to create it.
import postgres from 'postgres';

export function openDb(url = process.env.DATABASE_URL) {
  if (!url) throw new Error('DATABASE_URL is not set (see .env.example)');
  const sql = postgres(url, {
    max: Number(process.env.DB_POOL_MAX) || 5,
    idle_timeout: 20,
    prepare: false, // required by Supabase's transaction pooler (port 6543)
    onnotice: () => {},
    // BIGINT columns hold epoch ms, which fit in a JS number.
    types: { bigint: { to: 20, from: [20], parse: Number, serialize: String } },
  });

  // Columns written for each table, and app object -> row mapping.
  const COLS = {
    staff: ['id', 'name', 'role', 'pin', 'rate', 'active', 'tone', 'email', 'phone'],
    shifts: ['id', 'staff_id', 'date', 'start', 'end', 'area'],
    entries: ['id', 'staff_id', 'clock_in', 'clock_out', 'breaks', 'break_edited'],
  };
  const toRow = {
    staff: s => ({
      id: s.id, name: s.name, role: s.role, pin: s.pin, rate: Number(s.rate) || 0, active: !!s.active,
      tone: s.tone ?? 0, email: s.email || '', phone: s.phone || '',
    }),
    shifts: x => ({ id: x.id, staff_id: x.staffId, date: x.date, start: x.start, end: x.end, area: x.area }),
    entries: e => ({
      id: e.id, staff_id: e.staffId, clock_in: e.in, clock_out: e.out ?? null,
      breaks: JSON.stringify(e.breaks || []), break_edited: !!e.breakEdited,
    }),
  };
  const fromRow = {
    staff: r => ({
      id: r.id, name: r.name, role: r.role, pin: r.pin, rate: r.rate, active: r.active, tone: r.tone, email: r.email, phone: r.phone,
    }),
    shifts: r => ({ id: r.id, staffId: r.staff_id, date: r.date, start: r.start, end: r.end, area: r.area }),
    entries: r => ({
      id: r.id, staffId: r.staff_id, in: r.clock_in, out: r.clock_out, breaks: JSON.parse(r.breaks),
      ...(r.break_edited ? { breakEdited: true } : {}),
    }),
  };
  const TABLES = ['staff', 'shifts', 'entries']; // parents first for inserts

  // Apply { upsert: {table: [obj]}, delete: {table: [id]} } atomically.
  async function apply({ upsert = {}, delete: del = {} }) {
    for (const t of TABLES) {
      if (upsert[t] != null && !Array.isArray(upsert[t])) throw new Error(`upsert.${t} must be an array`);
      if (del[t] != null && !Array.isArray(del[t])) throw new Error(`delete.${t} must be an array`);
    }
    await sql.begin(async tx => {
      for (const t of TABLES) {
        if (!upsert[t]?.length) continue;
        // One row per id (last wins): Postgres rejects an upsert that touches a row twice.
        const rows = [...new Map(upsert[t].map(o => [o.id, toRow[t](o)])).values()];
        const set = COLS[t].filter(c => c !== 'id').map(c => `"${c}" = excluded."${c}"`).join(', ');
        await tx`INSERT INTO ${tx(t)} ${tx(rows, COLS[t])} ON CONFLICT (id) DO UPDATE SET ${tx.unsafe(set)}`;
      }
      for (const t of TABLES.slice().reverse()) {
        if (del[t]?.length) await tx`DELETE FROM ${tx(t)} WHERE id IN ${tx(del[t].map(String))}`;
      }
    });
  }

  async function all() {
    const [staff, shifts, entries] = await Promise.all([
      sql`SELECT * FROM staff ORDER BY pos`,
      sql`SELECT * FROM shifts ORDER BY date, start`,
      sql`SELECT * FROM entries ORDER BY clock_in`,
    ]);
    return { staff: staff.map(fromRow.staff), shifts: shifts.map(fromRow.shifts), entries: entries.map(fromRow.entries) };
  }

  const notifications = {
    log: n => sql`INSERT INTO notifications (staff_id, week_start, channel, recipient, status, error, roster, sent_at)
      VALUES (${n.staffId}, ${n.weekStart}, ${n.channel}, ${n.recipient}, ${n.status}, ${n.error ?? null}, ${n.roster}, ${n.sentAt})`,
    // Latest notification per staff member for a week, keyed by staff id.
    latest: async weekStart => Object.fromEntries((await sql`SELECT DISTINCT ON (staff_id) * FROM notifications
      WHERE week_start = ${weekStart} ORDER BY staff_id, id DESC`).map(r => [r.staff_id, {
      channel: r.channel, recipient: r.recipient, status: r.status, error: r.error, roster: r.roster, sentAt: r.sent_at,
    }])),
  };

  const admins = {
    count: async () => (await sql`SELECT COUNT(*) AS n FROM admins`)[0].n,
    byEmail: async email => (await sql`SELECT * FROM admins WHERE lower(email) = lower(${email})`)[0],
    create: async (email, name, password) =>
      (await sql`INSERT INTO admins (email, name, password, created_at) VALUES (${email}, ${name}, ${password}, ${Date.now()}) RETURNING id`)[0].id,
    setPassword: (id, password) => sql.begin(async tx => {
      await tx`UPDATE admins SET password = ${password} WHERE id = ${id}`;
      await tx`DELETE FROM sessions WHERE admin_id = ${id}`; // sign out everywhere
    }),
  };
  const sessions = {
    create: async (tokenHash, adminId, expiresAt) => {
      await sql`DELETE FROM sessions WHERE expires_at < ${Date.now()}`;
      await sql`INSERT INTO sessions (token_hash, admin_id, expires_at) VALUES (${tokenHash}, ${adminId}, ${expiresAt})`;
    },
    admin: async tokenHash => (await sql`SELECT a.id, a.email, a.name FROM sessions s JOIN admins a ON a.id = s.admin_id
      WHERE s.token_hash = ${tokenHash} AND s.expires_at > ${Date.now()}`)[0] || null,
    remove: tokenHash => sql`DELETE FROM sessions WHERE token_hash = ${tokenHash}`,
  };

  // Failure counters for auth.js's rate limiter.
  const limits = {
    get: async key => (await sql`SELECT first_at, count FROM rate_limits WHERE key = ${key}`)[0] || null,
    // Counts a failure, starting a new window if the current one is older than windowMs.
    fail: async (key, windowMs) => {
      const now = Date.now();
      await sql`INSERT INTO rate_limits (key, first_at, count) VALUES (${key}, ${now}, 1)
        ON CONFLICT (key) DO UPDATE SET
          count    = CASE WHEN rate_limits.first_at <= ${now - windowMs} THEN 1 ELSE rate_limits.count + 1 END,
          first_at = CASE WHEN rate_limits.first_at <= ${now - windowMs} THEN ${now} ELSE rate_limits.first_at END`;
      if (Math.random() < 0.05) await sql`DELETE FROM rate_limits WHERE first_at < ${now - 24 * 3600 * 1000}`;
    },
    reset: key => sql`DELETE FROM rate_limits WHERE key = ${key}`,
  };

  return { sql, all, apply, notifications, admins, sessions, limits, close: () => sql.end() };
}
