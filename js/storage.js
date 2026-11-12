// App data lives in the server's Postgres database (see /db.js); per-device
// preferences (theme, language, roster view) stay in localStorage.
const TKEY = 'punchcard.theme', LKEY = 'punchcard.lang', RKEY = 'punchcard.rosterView';
const TABLES = ['staff', 'shifts', 'entries'];

// JSON request to the API. Resolves to { ok, status, data } and never throws
// for HTTP errors, so callers can show the server's error message.
export async function request(method, path, body) {
  const res = await fetch(path, {
    method, cache: 'no-store',
    ...(body !== undefined && { headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

// Like request(), but throws on failure; err.status is 401 when the admin session ended.
async function must(method, path, body) {
  const r = await request(method, path, body);
  if (!r.ok) throw Object.assign(new Error(r.data.error || 'Request failed: ' + r.status), { status: r.status });
  return r.data;
}

export const loadData = () => must('GET', 'api/data');

// Send only the rows that differ between `prev` and `next`, so edits made on
// other devices in the meantime are not overwritten.
export async function saveData(prev, next) {
  const change = { upsert: {}, delete: {} };
  let any = false;
  for (const t of TABLES) {
    const before = new Map(prev[t].map(x => [x.id, JSON.stringify(x)]));
    const after = new Set(next[t].map(x => x.id));
    const up = next[t].filter(x => before.get(x.id) !== JSON.stringify(x));
    const del = prev[t].filter(x => !after.has(x.id)).map(x => x.id);
    if (up.length) { change.upsert[t] = up; any = true; }
    if (del.length) { change.delete[t] = del; any = true; }
  }
  if (!any) return;
  await must('POST', 'api/sync', change);
}

// Roster notifications (see /notify.js).
export const fetchNotify = week => must('GET', 'api/notify?week=' + encodeURIComponent(week));
export const sendNotify = (week, staffIds, lang) => must('POST', 'api/notify', { week, staffIds, lang });

const get = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const set = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };

export const loadTheme = () => get(TKEY);
export const saveTheme = theme => set(TKEY, theme);
export const loadLang = () => get(LKEY);
export const saveLang = lang => set(LKEY, lang);
export const loadRosterView = () => (get(RKEY) === 'day' ? 'day' : 'week');
export const saveRosterView = view => set(RKEY, view);
