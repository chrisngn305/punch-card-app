// The JSON API, shared by the local server (server.js) and the Vercel function
// (api/index.js). Admin endpoints need a signed-in admin (auth.js); the kiosk
// endpoints only need the staff member's PIN and never expose other people's
// data (js/kiosk.js).
import { openDb } from './db.js';
import { shiftH } from './js/utils.js';
import { emailConfig, isWeekKey, weekShifts, fingerprint, rosterEmail, sendEmail } from './notify.js';
import {
  hashPassword, verifyPassword, burnPasswordCheck, newToken, hashToken, readSessionToken, sessionCookie, clearCookie,
  rateLimiter, isEmail, SESSION_MS, MIN_PASSWORD,
} from './auth.js';
import { staffByPin, onClockCount, meView, clock, updateProfile } from './js/kiosk.js';

// Dates ("today", roster weeks) are worked out in the server's time zone. Hosts
// like Vercel run in UTC, so APP_TZ sets the venue's zone, e.g. Australia/Sydney.
if (process.env.APP_TZ) process.env.TZ = process.env.APP_TZ;

const secureCookies = process.env.COOKIE_SECURE === 'true'; // set when served over HTTPS
// Behind Vercel's proxy the socket address is the proxy's, so use the client IP
// header Vercel sets (it overwrites any value the client sends).
const trustProxy = process.env.TRUST_PROXY === 'true' || !!process.env.VERCEL;
// Without DATABASE_URL the server still starts (so the browser demo works),
// but every API request answers 503.
const db = process.env.DATABASE_URL ? openDb() : null;

// Brute-force protection, per client IP.
const loginLimiter = db && rateLimiter(db.limits, 'login', 10, 15 * 60 * 1000); // 10 failed logins per 15 min
const pinLimiter = db && rateLimiter(db.limits, 'pin', 10, 5 * 60 * 1000);      // 10 wrong PINs per 5 min

const clientIp = req => (trustProxy &&
  (req.headers['x-real-ip'] || String(req.headers['x-forwarded-for'] || '').split(',')[0].trim())) ||
  req.socket.remoteAddress || '';

const json = (res, status, body, headers = {}) => {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers });
  res.end(JSON.stringify(body));
};

async function readJson(req) {
  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 5e6) throw new Error('Body too large');
  }
  return JSON.parse(body || '{}');
}

// Everyone with shifts in the week, with their latest notification status.
async function notifyStatus(week) {
  const [data, latest] = await Promise.all([db.all(), db.notifications.latest(week)]);
  const recipients = data.staff.map(p => {
    const list = weekShifts(data, p.id, week);
    const last = latest[p.id] || null;
    return {
      staffId: p.id, name: p.name, email: p.email, shifts: list.length,
      hours: list.reduce((a, x) => a + shiftH(x), 0),
      last, changed: !!last && last.status !== 'failed' && last.roster !== fingerprint(list),
    };
  }).filter(r => r.shifts > 0);
  return { email: emailConfig(), week, recipients };
}

async function startSession(res, admin) {
  const token = newToken();
  await db.sessions.create(hashToken(token), admin.id, Date.now() + SESSION_MS);
  json(res, 200, { admin: { id: admin.id, email: admin.email, name: admin.name } }, { 'set-cookie': sessionCookie(token, secureCookies) });
}

// Looks up the staff member for a kiosk request, enforcing the PIN rate limit.
async function kioskStaff(res, ip, pin, data) {
  const wait = await pinLimiter.retryAfter(ip);
  if (wait) { json(res, 429, { error: 'err.tooMany', retryAfter: wait }); return null; }
  const p = staffByPin(data, pin);
  if (!p) { await pinLimiter.fail(ip); json(res, 401, { error: 'pin.error' }); return null; }
  return p;
}

async function api(req, res, path, query) {
  const ip = clientIp(req);
  let body = {};
  if (req.method === 'POST') {
    // JSON only: browsers can't send this cross-site without a CORS preflight.
    if (!/^application\/json\b/i.test(req.headers['content-type'] || '')) return json(res, 415, { error: 'Expected application/json' });
    try { body = await readJson(req); } catch { return json(res, 400, { error: 'Invalid JSON' }); }
    if (!body || typeof body !== 'object' || Array.isArray(body)) return json(res, 400, { error: 'Invalid JSON' });
  }
  const token = readSessionToken(req);
  const admin = token ? await db.sessions.admin(hashToken(token)) : null;

  switch (`${req.method} ${path}`) {
    // ── Admin sign-in ──────────────────────────────────────
    case 'GET /api/auth':
      return json(res, 200, { admin, setupNeeded: await db.admins.count() === 0 });

    case 'POST /api/auth/setup': { // first admin account; only while none exist
      if (await db.admins.count() > 0) return json(res, 403, { error: 'err.setupDone' });
      const email = String(body.email || '').trim().toLowerCase(), name = String(body.name || '').trim();
      if (!isEmail(email)) return json(res, 400, { error: 'err.email' });
      if (String(body.password || '').length < MIN_PASSWORD) return json(res, 400, { error: 'err.passwordShort' });
      const id = await db.admins.create(email, name, hashPassword(String(body.password)));
      return startSession(res, { id, email, name });
    }

    case 'POST /api/auth/login': {
      const wait = await loginLimiter.retryAfter(ip);
      if (wait) return json(res, 429, { error: 'err.tooMany', retryAfter: wait });
      const found = await db.admins.byEmail(String(body.email || '').trim().toLowerCase());
      const ok = found ? verifyPassword(String(body.password || ''), found.password) : burnPasswordCheck(String(body.password || ''));
      if (!ok) { await loginLimiter.fail(ip); return json(res, 401, { error: 'err.login' }); }
      await loginLimiter.reset(ip);
      return startSession(res, found);
    }

    case 'POST /api/auth/logout':
      if (token) await db.sessions.remove(hashToken(token));
      return json(res, 200, { ok: true }, { 'set-cookie': clearCookie() });

    // ── Kiosk (PIN only) ───────────────────────────────────
    case 'GET /api/kiosk':
      return json(res, 200, { onClock: onClockCount(await db.all()) });

    case 'POST /api/kiosk/me': {
      const data = await db.all(), p = await kioskStaff(res, ip, body.pin, data);
      return p && json(res, 200, { me: meView(data, p) });
    }

    case 'POST /api/kiosk/clock': {
      const data = await db.all(), p = await kioskStaff(res, ip, body.pin, data);
      if (!p) return;
      const r = clock(data, p, body.action, body.breakMinutes);
      if (r.error) return json(res, 409, { error: r.error, me: meView(data, p) });
      await db.apply({ upsert: { entries: [r.entry] } });
      return json(res, 200, { result: r.result, me: meView(await db.all(), p) });
    }

    case 'POST /api/kiosk/profile': {
      const data = await db.all(), p = await kioskStaff(res, ip, body.pin, data);
      if (!p) return;
      const r = updateProfile(data, p, body);
      if (r.error) {
        if (r.error === 'err.pinUsed') await pinLimiter.fail(ip); // don't let this become a way to probe PINs
        return json(res, 400, { error: r.error });
      }
      await db.apply({ upsert: { staff: [r.staff] } });
      return json(res, 200, { me: meView(await db.all(), r.staff) });
    }
  }

  // ── Everything below needs a signed-in admin ─────────────
  if (!admin) return json(res, 401, { error: 'err.signIn' });

  switch (`${req.method} ${path}`) {
    // GET /api/data → { staff, shifts, entries }
    case 'GET /api/data':
      return json(res, 200, await db.all());

    // POST /api/sync { upsert: { table: [rows] }, delete: { table: [ids] } }
    case 'POST /api/sync':
      try {
        await db.apply(body);
        return json(res, 200, { ok: true });
      } catch (e) {
        return json(res, 400, { error: e.message });
      }

    // GET /api/notify?week=YYYY-MM-DD → who can be sent this week's roster
    case 'GET /api/notify': {
      const week = query.get('week');
      if (!isWeekKey(week)) return json(res, 400, { error: 'week must be a Monday as YYYY-MM-DD' });
      return json(res, 200, await notifyStatus(week));
    }

    // POST /api/notify { week, staffIds, lang } → email each person their shifts
    case 'POST /api/notify': {
      const { week, staffIds = [], lang } = body;
      if (!isWeekKey(week) || !Array.isArray(staffIds)) return json(res, 400, { error: 'Invalid request' });
      const data = await db.all(), results = [];
      for (const id of new Set(staffIds)) {
        const p = data.staff.find(x => x.id === id);
        const list = p ? weekShifts(data, p.id, week) : [];
        if (!p || !list.length) { results.push({ staffId: id, status: 'skipped', error: 'No shifts this week' }); continue; }
        if (!isEmail(p.email)) { results.push({ staffId: id, status: 'skipped', error: 'No email address' }); continue; }
        let status, error = null;
        try {
          status = await sendEmail({ to: p.email, ...rosterEmail(p, list, week, lang) });
        } catch (e) {
          status = 'failed'; error = e.message;
          console.error(`Email to ${p.email} failed:`, e.message);
        }
        await db.notifications.log({ staffId: p.id, weekStart: week, channel: 'email', recipient: p.email, status, error, roster: fingerprint(list), sentAt: Date.now() });
        results.push({ staffId: id, status, error });
      }
      return json(res, 200, { results, ...await notifyStatus(week) });
    }
  }
  json(res, 404, { error: 'Not found' });
}

// Handles one /api/* request.
export async function handleApi(req, res) {
  let url, path;
  try {
    url = new URL(req.url, 'http://localhost');
    path = decodeURIComponent(url.pathname).replace(/\/+$/, '');
  } catch { return json(res, 400, { error: 'Bad request' }); }
  if (!db) return json(res, 503, { error: 'err.noDb' });
  try {
    await api(req, res, path, url.searchParams);
  } catch (e) {
    console.error(e);
    if (res.headersSent) res.end(); else json(res, 500, { error: 'Server error' });
  }
}
