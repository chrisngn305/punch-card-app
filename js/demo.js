// "Try demo": the whole app running in this browser on sample data, with no
// server or database. It answers the same requests as /handler.js (using the
// same kiosk code) and keeps its data in localStorage, so a reload stays in
// the demo. Nothing leaves the browser: roster emails are only recorded.
import { seed, exampleEmail } from './seed.js';
import { staffByPin, onClockCount, meView, clock, updateProfile } from './kiosk.js';
import { isWeekKey, weekShifts, fingerprint, shiftH, isEmail } from './utils.js';

const KEY = 'punchcard.demo';
const TABLES = ['staff', 'shifts', 'entries'];
export const DEMO_ADMIN = { id: 'demo', email: 'demo@example.com', name: 'Demo admin' };

let db = null; // { staff, shifts, entries, notifications }

const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {} };

export const inDemo = () => !!db;

// Picks up a demo saved by an earlier visit; returns whether there was one.
export function resumeDemo() {
  try { db = JSON.parse(localStorage.getItem(KEY)); } catch (e) { db = null; }
  return inDemo();
}

// Starts the demo, or restarts it with fresh sample data.
export function startDemo() {
  db = { ...seed(exampleEmail), notifications: [] };
  persist();
}

export function endDemo() {
  db = null;
  try { localStorage.removeItem(KEY); } catch (e) {}
}

const all = () => structuredClone({ staff: db.staff, shifts: db.shifts, entries: db.entries });

// Same shape as db.apply() in /db.js. Deleting a staff member also deletes
// their shifts and entries, like the database's ON DELETE CASCADE.
function apply({ upsert = {}, delete: del = {} }) {
  for (const t of TABLES) {
    const rows = structuredClone(upsert[t] || []);
    const drop = new Set([...(del[t] || []), ...rows.map(x => x.id)]);
    db[t] = db[t].filter(x => !drop.has(x.id)).concat(rows);
  }
  const ids = new Set(db.staff.map(p => p.id));
  db.shifts = db.shifts.filter(x => ids.has(x.staffId));
  db.entries = db.entries.filter(x => ids.has(x.staffId));
  persist();
}

function notifyStatus(week) {
  const data = all();
  const recipients = data.staff.map(p => {
    const list = weekShifts(data, p.id, week);
    const last = db.notifications.filter(n => n.staffId === p.id && n.weekStart === week).at(-1) || null;
    return {
      staffId: p.id, name: p.name, email: p.email, shifts: list.length,
      hours: list.reduce((a, x) => a + shiftH(x), 0),
      last, changed: !!last && last.roster !== fingerprint(list),
    };
  }).filter(r => r.shifts > 0);
  return { email: { configured: false, from: '', demo: true }, week, recipients };
}

const ok = data => ({ ok: true, status: 200, data });
const err = (status, error, extra) => ({ ok: false, status, data: { error, ...extra } });

// Stands in for fetch() in storage.js's request(): same { ok, status, data } result.
export async function demoRequest(method, path, body = {}) {
  const url = new URL(path, 'http://demo/');
  const data = all();
  const p = body.pin !== undefined && staffByPin(data, body.pin);

  switch (`${method} ${url.pathname}`) {
    case 'GET /api/auth': return ok({ admin: null, setupNeeded: false });
    case 'POST /api/auth/logout': return ok({ ok: true });

    case 'GET /api/kiosk': return ok({ onClock: onClockCount(data) });
    case 'POST /api/kiosk/me': return p ? ok({ me: meView(data, p) }) : err(401, 'pin.error');
    case 'POST /api/kiosk/clock': {
      if (!p) return err(401, 'pin.error');
      const r = clock(data, p, body.action, body.breakMinutes);
      if (r.error) return err(409, r.error, { me: meView(data, p) });
      apply({ upsert: { entries: [r.entry] } });
      return ok({ result: r.result, me: meView(all(), p) });
    }
    case 'POST /api/kiosk/profile': {
      if (!p) return err(401, 'pin.error');
      const r = updateProfile(data, p, body);
      if (r.error) return err(400, r.error);
      apply({ upsert: { staff: [r.staff] } });
      return ok({ me: meView(all(), r.staff) });
    }

    // Admin: the demo is always signed in (see openAdmin in app.js).
    case 'GET /api/data': return ok(data);
    case 'POST /api/sync': apply(body); return ok({ ok: true });

    case 'GET /api/notify': {
      const week = url.searchParams.get('week');
      return isWeekKey(week) ? ok(notifyStatus(week)) : err(400, 'Invalid request');
    }
    case 'POST /api/notify': {
      const { week, staffIds = [] } = body;
      if (!isWeekKey(week)) return err(400, 'Invalid request');
      const results = [];
      for (const id of new Set(staffIds)) {
        const person = data.staff.find(x => x.id === id), list = person ? weekShifts(data, id, week) : [];
        if (!list.length || !isEmail(person.email)) { results.push({ staffId: id, status: 'skipped' }); continue; }
        db.notifications.push({ staffId: id, weekStart: week, channel: 'email', recipient: person.email, status: 'preview', roster: fingerprint(list), sentAt: Date.now() });
        results.push({ staffId: id, status: 'preview', error: null });
      }
      persist();
      return ok({ results, ...notifyStatus(week) });
    }
  }
  return err(404, 'Not found');
}
