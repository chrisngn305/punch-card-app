import { config } from './config.js';
import {
  request, loadData, saveData, loadTheme, saveTheme, loadLang, saveLang, loadRosterView, saveRosterView, fetchNotify, sendNotify,
} from './storage.js';
import { t, tv, setLang, getLang } from './i18n.js';
import {
  pad, dkey, fromKey, addDays, toMin, at, hm, dur, brkMs, workMs, brkLabel,
  uid, firstName, areaForRole, TONES, HOUR, MINUTE,
} from './utils.js';
import { inDemo, resumeDemo, startDemo, endDemo, DEMO_ADMIN } from './demo.js';
import { buildView, themeName, openEntryFor, timesheetEntries, timesheetWeekStart, rosterWeekStart } from './viewmodel.js';
import { appView } from './views/index.js';
import { morph } from './morph.js';

const root = document.getElementById('app');

// ── State ──────────────────────────────────────────────────
setLang(loadLang() || config.defaultLang || 'en');

let state = {
  data: null, theme: loadTheme(), lang: getLang(),
  mode: 'kiosk', // 'kiosk' | 'login' | 'admin'
  demo: false, offline: false, // offline: no server or database, so only the demo works
  auth: { admin: null, setupNeeded: false },
  // kiosk: `me` is the signed-in staff member's own record from the server
  pin: '', pinError: false, pinErrorMsg: '', step: 'pin', me: null, onClock: 0, busy: false,
  done: {}, cfBrk: 0, cfText: null,
  pf: null, pfError: '', pfBusy: false, // "update my details" form
  // admin sign-in
  login: { name: '', email: '', password: '', password2: '' }, loginError: '', loginBusy: false,
  // admin
  tab: 'overview', tsWeek: 0, tsStaff: 'all', roWeek: 0, roView: loadRosterView(), roDay: (new Date().getDay() + 6) % 7,
  modal: null, form: {}, formError: '', showPins: false,
  notify: null, // { week, loading, error, data, selected: [staffId], sending }
  toast: '', now: Date.now(),
};

let queued = false;
function setState(patch) {
  state = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) };
  if (!queued) { queued = true; requestAnimationFrame(render); }
}

let focusTimeline = false;
function render() {
  queued = false;
  morph(root, appView(buildView(state, config)).toString());
  if (focusTimeline) { focusTimeline = false; scrollTimeline(); }
}

// Scroll the day timeline so "now" (or the day's first shift) is in view.
function scrollTimeline() {
  const sc = root.querySelector('.tl-scroll');
  const target = sc && (sc.querySelector('.tl-now') || sc.querySelector('.tl-bar'));
  if (!target || sc.scrollWidth <= sc.clientWidth) return;
  const name = sc.querySelector('.tl-name').getBoundingClientRect().width;
  const x = target.getBoundingClientRect().left - sc.getBoundingClientRect().left + sc.scrollLeft;
  sc.scrollLeft = Math.max(0, x - name - (target.classList.contains('tl-now') ? (sc.clientWidth - name) / 3 : 12));
}

const timers = {};
const later = (name, ms, fn) => { clearTimeout(timers[name]); timers[name] = setTimeout(fn, ms); };

const clone = () => structuredClone(state.data);

// Saves are applied optimistically and sent to the server one at a time, in order.
let saving = Promise.resolve(), saveSeq = 0;
function save(data) {
  const prev = state.data;
  saveSeq++;
  setState({ data });
  saving = saving
    .then(() => saveData(prev, data))
    .catch(e => {
      if (e.status === 401) return sessionEnded();
      flash(t('common.saveFailed'));
      return refresh(true);
    });
}

// Pull the latest data (e.g. changes from another kiosk or admin screen).
async function refresh(force = false) {
  if (state.mode !== 'admin') return;
  const seq = saveSeq;
  if (!force) await saving; // let pending saves land first
  try {
    const data = await loadData();
    if (state.mode === 'admin' && (force || seq === saveSeq)) setState({ data }); // drop if a local edit happened meanwhile
  } catch (e) {
    if (e.status === 401) sessionEnded();
  }
}
function flash(toast) { setState({ toast }); later('toast', 2600, () => setState({ toast: '' })); }
const armIdle = sec => later('idle', sec * 1000, resetKiosk);

function applyTheme(t) {
  document.documentElement.dataset.theme = t;
}
function setTheme(theme) { saveTheme(theme); applyTheme(theme); setState({ theme }); }
function setLanguage(lang) {
  setLang(lang); saveLang(lang);
  document.documentElement.lang = lang;
  setState({ lang });
}

// ── Kiosk ──────────────────────────────────────────────────
// The signed-in staff member's PIN. Every kiosk request sends it; it is kept
// out of `state` and cleared as soon as the kiosk resets.
let kioskPin = '';

function press(k) {
  if (state.step !== 'pin' || state.busy) return;
  let p = state.pin;
  if (k === 'Clear') p = '';
  else if (k === 'Delete') p = p.slice(0, -1);
  else if (p.length < 4) p += k;
  setState({ pin: p, pinError: false });
  if (p.length === 4) setTimeout(() => submitPin(p), 140);
}

async function submitPin(p) {
  setState({ busy: true });
  const r = await request('POST', 'api/kiosk/me', { pin: p }).catch(() => null);
  setState({ busy: false });
  if (!r?.ok) return fail(r?.status === 429 ? t('err.tooMany', { s: r.data.retryAfter }) : r ? '' : t('common.offline'));
  kioskPin = p;
  setState({ step: 'staff', me: r.data.me, pin: '' });
  armIdle(20);
}

function fail(msg = '') {
  setState({ pinError: true, pinErrorMsg: msg, pin: '' });
  later('error', msg ? 4000 : 1800, () => setState({ pinError: false, pinErrorMsg: '' }));
}

function resetKiosk() {
  clearTimeout(timers.idle);
  kioskPin = '';
  setState({ step: 'pin', me: null, pin: '', pinError: false, pf: null, pfError: '' });
}

async function refreshKiosk() {
  const r = await request('GET', 'api/kiosk').catch(() => null);
  if (r?.ok) setState({ onClock: r.data.onClock });
}

// Sends a clock action; returns the server's result or null (after showing why).
async function clockAction(action, breakMinutes) {
  if (state.busy) return null;
  setState({ busy: true });
  const r = await request('POST', 'api/kiosk/clock', { pin: kioskPin, action, breakMinutes }).catch(() => null);
  setState({ busy: false });
  if (!r?.ok) {
    if (r?.status === 401 || r?.status === 429) { resetKiosk(); return null; } // PIN changed elsewhere
    flash(r ? t(r.data.error || 'common.saveFailed') : t('common.offline'));
    if (r?.data.me) setState({ me: r.data.me, step: 'staff' });
    return null;
  }
  setState({ me: r.data.me });
  refreshKiosk();
  return r.data.result;
}

async function act(type) {
  if (type === 'out') return startConfirm();
  const res = await clockAction(type);
  if (!res) return;
  const first = firstName(state.me.name);
  const [verb, line] = { in: ['done.in', 'done.inLine'], bstart: ['done.bstart', 'done.bstartLine'], bend: ['done.bend', 'done.bendLine'] }[type];
  setState({ step: 'done', done: { verb: t(verb), time: hm(res.at), line: t(line, { name: first }) } });
  armIdle(config.autoReturn);
}

function startConfirm() {
  const e = state.me?.open;
  if (!e) return;
  setState({ step: 'confirm', cfBrk: Math.round(brkMs(e, Date.now()) / MINUTE), cfText: null });
  armIdle(45);
}

function setBreak(mins, text = null) {
  setState({ cfBrk: Math.max(0, Math.min(600, mins)), cfText: text });
  armIdle(45);
}

async function confirmOut() {
  const e = state.me?.open;
  if (!e) return resetKiosk();
  if (state.cfBrk * MINUTE >= Date.now() - e.in) return; // break longer than the shift
  const res = await clockAction('out', state.cfBrk);
  if (!res) return;
  setState({
    step: 'done',
    done: {
      verb: t('done.out'), time: hm(res.at),
      line: t('done.outLine', {
        worked: dur(res.workedMs), from: hm(res.in), to: hm(res.at), brk: brkLabel(res.breakMin).toLowerCase(), name: firstName(state.me.name),
      }),
    },
  });
  armIdle(config.autoReturn);
}

// Staff updating their own name, PIN and email.
function openProfile() {
  setState({ step: 'profile', pf: { name: state.me.name, email: state.me.email || '', pin: '', pin2: '' }, pfError: '' });
  armIdle(90);
}

async function saveProfile() {
  const f = state.pf;
  if (!f || state.pfBusy) return;
  if (!f.name.trim()) return setState({ pfError: t('err.name') });
  if (f.pin && !/^\d{4}$/.test(f.pin)) return setState({ pfError: t('err.pinFormat') });
  if (f.pin !== f.pin2) return setState({ pfError: t('err.pinMatch') });
  setState({ pfBusy: true });
  const r = await request('POST', 'api/kiosk/profile', { pin: kioskPin, name: f.name, email: f.email, newPin: f.pin }).catch(() => null);
  setState({ pfBusy: false });
  if (!r?.ok) {
    if (r?.status === 401 || r?.status === 429) return resetKiosk();
    return setState({ pfError: r ? t(r.data.error || 'common.saveFailed') : t('common.offline') });
  }
  if (f.pin) kioskPin = f.pin;
  setState({ step: 'staff', me: r.data.me, pf: null, pfError: '' });
  flash(t(f.pin ? 'toast.profilePin' : 'toast.profileSaved'));
  armIdle(20);
}

// ── Admin sign-in ──────────────────────────────────────────
async function openAdmin() {
  if (state.demo) return enterAdmin({ admin: DEMO_ADMIN, setupNeeded: false }); // no sign-in in the demo
  const r = await request('GET', 'api/auth').catch(() => null);
  const auth = r?.ok ? r.data : state.auth;
  if (auth.admin) return enterAdmin(auth);
  resetKiosk();
  setState({ auth, mode: 'login', login: { name: '', email: '', password: '', password2: '' }, loginError: '' });
}

async function enterAdmin(auth = state.auth) {
  resetKiosk();
  setState({ auth, mode: 'admin', tab: 'overview', data: null });
  try { setState({ data: await loadData() }); } catch (e) { if (e.status === 401) sessionEnded(); }
}

async function submitLogin() {
  const f = state.login, setup = state.auth.setupNeeded;
  if (state.loginBusy) return;
  if (setup) {
    if (f.password.length < 8) return setState({ loginError: t('err.passwordShort') });
    if (f.password !== f.password2) return setState({ loginError: t('err.passwordMatch') });
  }
  setState({ loginBusy: true, loginError: '' });
  const r = await request('POST', setup ? 'api/auth/setup' : 'api/auth/login', { name: f.name, email: f.email, password: f.password }).catch(() => null);
  setState({ loginBusy: false });
  if (!r?.ok) {
    if (r?.data.error === 'err.setupDone') return openAdmin(); // someone else finished setup first
    return setState({
      loginError: !r ? t('common.offline') : r.status === 429 ? t('err.tooMany', { s: r.data.retryAfter }) : t(r.data.error || 'err.login'),
      login: { ...f, password: '', password2: '' },
    });
  }
  setState({ login: { name: '', email: '', password: '', password2: '' } });
  enterAdmin({ admin: r.data.admin, setupNeeded: false });
}

async function signOut() {
  await request('POST', 'api/auth/logout', {}).catch(() => null);
  setState({ auth: { admin: null, setupNeeded: false }, mode: 'kiosk', data: null, modal: null, notify: null });
  resetKiosk();
  refreshKiosk();
}

// The admin session expired or was revoked: back to the sign-in screen.
function sessionEnded() {
  setState({
    auth: { admin: null, setupNeeded: false }, mode: 'login', data: null, modal: null, notify: null,
    login: { name: '', email: '', password: '', password2: '' }, loginError: t('err.sessionEnded'),
  });
}

// ── Demo ───────────────────────────────────────────────────
// The demo runs entirely in this browser (demo.js), so it works without a database.
function tryDemo() {
  startDemo();
  showDemo();
  flash(t('demo.started'));
}

function showDemo() {
  resetKiosk();
  setState({ demo: true, offline: false, mode: 'kiosk', auth: { admin: null, setupNeeded: false }, data: null, modal: null, notify: null });
  refreshKiosk();
}

async function resetDemo() {
  startDemo();
  closeModal();
  if (state.mode === 'admin') setState({ data: await loadData() });
  else resetKiosk();
  refreshKiosk();
  flash(t('demo.resetDone'));
}

function exitDemo() {
  endDemo();
  resetKiosk();
  setState({ demo: false, mode: 'kiosk', auth: { admin: null, setupNeeded: false }, data: null, modal: null, notify: null, onClock: 0 });
  connect();
}

// ── Admin ──────────────────────────────────────────────────
function adminClockOut(id) {
  const data = clone(), now = Date.now();
  const e = openEntryFor(data, id);
  if (!e) return;
  e.breaks.forEach(b => { if (!b.end) b.end = now; });
  e.out = now;
  save(data);
  flash(t('toast.clockedOut', { t: hm(now) }));
}

function newPin() {
  const used = new Set(state.data.staff.map(x => x.pin));
  let p;
  do { p = String(Math.floor(Math.random() * 10000)).padStart(4, '0'); } while (used.has(p));
  return p;
}

const openModal = (type, id, form) => setState({ modal: { type, id: id || null }, form, formError: '' });
const closeModal = () => setState({ modal: null, formError: '', notify: null });
const formError = formError => setState({ formError });

function openShift(sh, staffId, date, hour) {
  const { staff } = state.data;
  if (sh) return openModal('shift', sh.id, { ...sh });
  const st = staff.find(x => x.id === staffId) || staff.find(x => x.active);
  if (!st) return flash(t('toast.addStaffFirst'));
  // From the day timeline: start at the clicked hour, default to an 8h shift (same day).
  const h = hour == null ? null : Number(hour);
  const start = h == null ? '09:00' : pad(h) + ':00';
  const end = h == null ? '17:00' : h >= 23 ? '23:59' : pad(Math.min(h + 8, 23)) + ':00';
  openModal('shift', null, { staffId: st.id, date: date || dkey(Date.now()), start, end, area: areaForRole(st.role) });
}

function openEntry(e) {
  if (e) {
    return openModal('entry', e.id, {
      staffId: e.staffId, date: dkey(e.in), in: hm(e.in), out: e.out ? hm(e.out) : '',
      brk: String(Math.round(brkMs(e, Date.now()) / MINUTE)),
    });
  }
  const st = state.data.staff.find(x => x.active);
  if (!st) return flash(t('toast.addStaffFirst'));
  openModal('entry', null, { staffId: st.id, date: dkey(Date.now()), in: '09:00', out: '17:00', brk: '30' });
}

function openStaff(p) {
  openModal('staff', p && p.id, p
    ? { name: p.name, role: p.role, pin: p.pin, rate: String(p.rate), active: p.active, email: p.email || '', phone: p.phone || '' }
    : { name: '', role: 'Barista', pin: newPin(), rate: '18', active: true, email: '', phone: '' });
}

// ── Roster notifications ───────────────────────────────────
const hasEmail = r => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email || '');
// People who still need this week's roster: never sent, only previewed, failed, or changed since.
const needsSend = r => hasEmail(r) && (!r.last || r.last.status !== 'sent' || r.changed);

async function openNotify() {
  const week = dkey(rosterWeekStart(state));
  openModal('notify', null, {});
  setState({ notify: { week, loading: true, selected: [] } });
  try {
    const data = await fetchNotify(week);
    if (state.notify?.week !== week) return;
    setState({ notify: { week, data, selected: data.recipients.filter(needsSend).map(r => r.staffId) } });
  } catch (e) {
    if (e.status === 401) return sessionEnded();
    if (state.notify?.week === week) setState({ notify: { week, error: true, selected: [] } });
  }
}

function pickNotify(mode) {
  const rs = state.notify?.data?.recipients || [];
  const selected = mode === 'all' ? rs.filter(hasEmail) : mode === 'needed' ? rs.filter(needsSend) : [];
  setState(s => ({ notify: { ...s.notify, selected: selected.map(r => r.staffId) } }));
}

async function sendRoster() {
  const n = state.notify;
  if (!n?.data || n.sending || !n.selected.length) return;
  setState({ notify: { ...n, sending: true } });
  try {
    const res = await sendNotify(n.week, n.selected, getLang());
    const count = st => res.results.filter(r => r.status === st).length;
    const failed = count('failed');
    if (failed) {
      flash(t('toast.sendFailed', { n: failed }));
      setState({ notify: { week: n.week, data: res, selected: res.recipients.filter(needsSend).map(r => r.staffId) } });
    } else {
      flash(state.demo ? t('toast.demoPreviewed', { n: count('preview') })
        : count('preview') ? t('toast.previewed', { n: count('preview') }) : t('toast.sent', { n: count('sent') }));
      closeModal();
    }
  } catch (e) {
    if (e.status === 401) return sessionEnded();
    flash(t('toast.sendFailed', { n: n.selected.length }));
    setState(s => ({ notify: { ...s.notify, sending: false } }));
  }
}

function saveModal() {
  const { modal, form } = state, data = clone();
  if (modal.type === 'notify') return sendRoster();

  if (modal.type === 'shift') {
    if (!form.date || !form.start || !form.end) return formError(t('err.shiftFields'));
    if (toMin(form.end) <= toMin(form.start)) return formError(t('err.endAfterStart'));
    const clash = data.shifts.find(x => x.id !== modal.id && x.staffId === form.staffId && x.date === form.date
      && toMin(x.start) < toMin(form.end) && toMin(form.start) < toMin(x.end));
    if (clash) return formError(t('err.overlap', { from: clash.start, to: clash.end }));
    const sh = { id: modal.id || uid(), staffId: form.staffId, date: form.date, start: form.start, end: form.end, area: form.area };
    data.shifts = modal.id ? data.shifts.map(x => x.id === modal.id ? sh : x) : data.shifts.concat(sh);
    save(data); closeModal(); flash(t(modal.id ? 'toast.shiftUpdated' : 'toast.shiftAdded'));
  }

  if (modal.type === 'entry') {
    if (!form.date || !form.in) return formError(t('err.entryFields'));
    const day = fromKey(form.date), inT = at(day, form.in), outT = form.out ? at(day, form.out) : null;
    if (outT !== null && outT <= inT) return formError(t('err.outAfterIn'));
    const bm = Math.max(0, parseInt(form.brk || '0', 10) || 0);
    if (outT !== null && bm * MINUTE >= outT - inT) return formError(t('err.breakTooLong'));
    if (outT === null && data.entries.find(x => x.id !== modal.id && x.staffId === form.staffId && !x.out)) {
      return formError(t('err.openEntry'));
    }
    const bs = inT + Math.min(4 * HOUR, outT ? (outT - inT - bm * MINUTE) / 2 : 4 * HOUR);
    const e = { id: modal.id || uid(), staffId: form.staffId, in: inT, out: outT, breaks: bm ? [{ start: bs, end: bs + bm * MINUTE }] : [] };
    data.entries = modal.id ? data.entries.map(x => x.id === modal.id ? e : x) : data.entries.concat(e);
    save(data); closeModal(); flash(t(modal.id ? 'toast.entryUpdated' : 'toast.entryAdded'));
  }

  if (modal.type === 'staff') {
    const name = (form.name || '').trim();
    if (!name) return formError(t('err.name'));
    if (!/^\d{4}$/.test(form.pin || '')) return formError(t('err.pinFormat'));
    if (data.staff.find(x => x.id !== modal.id && x.pin === form.pin)) return formError(t('err.pinUsed'));
    const email = (form.email || '').trim(), phone = (form.phone || '').trim();
    if (email && !hasEmail({ email })) return formError(t('err.email'));
    const fields = { name, role: form.role, pin: form.pin, rate: parseFloat(form.rate) || 0, active: !!form.active, email, phone };
    if (modal.id) data.staff = data.staff.map(x => x.id === modal.id ? { ...x, ...fields } : x);
    else data.staff.push({ id: 's' + uid(), ...fields, tone: data.staff.length % TONES.length });
    save(data); closeModal(); flash(modal.id ? t('toast.staffUpdated') : t('toast.staffAdded', { name: firstName(name), pin: form.pin }));
  }
}

function deleteItem() {
  const { modal } = state, data = clone();
  if (modal.type === 'shift') data.shifts = data.shifts.filter(x => x.id !== modal.id);
  if (modal.type === 'entry') data.entries = data.entries.filter(x => x.id !== modal.id);
  if (modal.type === 'staff') {
    data.staff = data.staff.filter(x => x.id !== modal.id);
    data.shifts = data.shifts.filter(x => x.staffId !== modal.id);
  }
  save(data); closeModal(); flash(t('toast.deleted'));
}

function exportCsv() {
  const rows = timesheetEntries(state), ws = timesheetWeekStart(state), cur = config.currency;
  const esc = v => /[",\n]/.test(String(v)) ? '"' + String(v).replace(/"/g, '""') + '"' : String(v);
  const lines = [['csv.staff', 'csv.role', 'csv.date', 'csv.in', 'csv.out', 'csv.break', 'csv.hours', 'csv.rate', 'csv.pay'].map(k => t(k, { cur }))]
    .concat(rows.map(({ e, p, h }) => [
      p.name, tv('role', p.role), dkey(e.in), hm(e.in), e.out ? hm(e.out) : '',
      Math.round(brkMs(e, state.now) / MINUTE), h.toFixed(2), p.rate, (h * p.rate).toFixed(2),
    ]));
  // BOM so Excel reads UTF-8 (Vietnamese) correctly.
  const blob = new Blob(['\uFEFF' + lines.map(l => l.map(esc).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = t('csv.file') + '_' + dkey(ws) + '.csv';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 0);
  flash(t('toast.exported', { n: rows.length }));
}

function copyPrev() {
  const ws = rosterWeekStart(state), data = clone();
  const prevS = dkey(addDays(ws, -7)), prevE = dkey(addDays(ws, -1));
  let n = 0;
  data.shifts.filter(x => x.date >= prevS && x.date <= prevE).forEach(x => {
    const nd = dkey(addDays(fromKey(x.date), 7));
    if (!data.shifts.find(y => y.staffId === x.staffId && y.date === nd)) { data.shifts.push({ ...x, id: uid(), date: nd }); n++; }
  });
  save(data);
  flash(n ? t('toast.copied', { n }) : t('toast.nothingToCopy'));
}

const findBy = (list, id) => state.data[list].find(x => x.id === id);

// ── Event wiring ───────────────────────────────────────────
// Click handlers, keyed by data-action; they receive the element's dataset.
const actions = {
  noop() {},
  toggleTheme: () => setTheme(themeName(state, config) === 'dark' ? 'light' : 'dark'),
  toggleLang: () => setLanguage(getLang() === 'vi' ? 'en' : 'vi'),

  // kiosk
  press: ({ key }) => press(key),
  openAdmin,
  tryDemo, resetDemo, exitDemo,
  backToKiosk: () => { setState({ mode: 'kiosk', loginError: '' }); refreshKiosk(); },
  signOut,
  openProfile,
  saveProfile,
  cancelProfile: () => { setState({ step: 'staff', pf: null, pfError: '' }); armIdle(20); },
  act: ({ type }) => act(type),
  resetKiosk,
  cfOpt: ({ value }) => setBreak(Number(value)),
  cfMinus: () => setBreak(state.cfBrk - 5),
  cfPlus: () => setBreak(state.cfBrk + 5),
  confirmOut,
  backToStaff: () => { setState({ step: 'staff' }); armIdle(20); },

  // admin
  tab: ({ tab }) => { focusTimeline = tab === 'roster'; setState({ tab }); },
  adminClockOut: ({ id }) => adminClockOut(id),

  tsPrev: () => setState(s => ({ tsWeek: s.tsWeek - 1 })),
  tsNext: () => setState(s => ({ tsWeek: s.tsWeek + 1 })),
  tsThis: () => setState({ tsWeek: 0 }),
  addEntry: () => openEntry(null),
  editEntry: ({ id }) => openEntry(findBy('entries', id)),
  exportCsv,

  roPrev: () => setState(s => ({ roWeek: s.roWeek - 1 })),
  roNext: () => setState(s => ({ roWeek: s.roWeek + 1 })),
  roThis: () => setState({ roWeek: 0 }),
  roPick: ({ day }) => { focusTimeline = true; setState({ roDay: Number(day) }); },
  roView: ({ view }) => { focusTimeline = true; saveRosterView(view); setState({ roView: view }); },
  addShiftAt: ({ staff, date, hour }) => openShift(null, staff, date, hour),
  openNotify,
  notifyPick: ({ mode }) => pickNotify(mode),
  copyPrev,
  addShift: () => openShift(null, null, state.roWeek === 0 ? dkey(Date.now()) : dkey(rosterWeekStart(state))),
  addShiftDay: () => openShift(null, null, dkey(addDays(rosterWeekStart(state), state.roDay))),
  addShiftCell: ({ staff, date }) => openShift(null, staff, date),
  editShift: ({ id }) => openShift(findBy('shifts', id)),

  togglePins: () => setState(s => ({ showPins: !s.showPins })),
  addStaff: () => openStaff(null),
  editStaff: ({ id }) => openStaff(findBy('staff', id)),

  closeModal, saveModal, deleteItem,
  randomPin: () => setState(s => ({ form: { ...s.form, pin: newPin() } })),
};

// Input handlers, keyed by data-input; they receive the element.
const inputs = {
  field(el) {
    const k = el.dataset.field;
    let v = el.type === 'checkbox' ? el.checked : el.value;
    if (k === 'pin') v = v.replace(/\D/g, '').slice(0, 4);
    setState(s => ({ form: { ...s.form, [k]: v }, formError: '' }));
  },
  cfInput(el) {
    const t = el.value.replace(/\D/g, '').slice(0, 3);
    setBreak(parseInt(t || '0', 10), t);
  },
  tsStaff: el => setState({ tsStaff: el.value }),
  pfField(el) {
    const k = el.dataset.field;
    let v = el.value;
    if (k === 'pin' || k === 'pin2') v = v.replace(/\D/g, '').slice(0, 4);
    setState(s => ({ pf: { ...s.pf, [k]: v }, pfError: '' }));
    armIdle(90);
  },
  loginField: el => setState(s => ({ login: { ...s.login, [el.dataset.field]: el.value }, loginError: '' })),
  notifyToggle(el) {
    const id = el.dataset.id;
    setState(s => {
      const sel = s.notify.selected.filter(x => x !== id);
      return { notify: { ...s.notify, selected: el.checked ? sel.concat(id) : sel } };
    });
  },
};

root.addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  if (el && !el.disabled) actions[el.dataset.action]?.(el.dataset, e);
});
root.addEventListener('input', e => {
  const el = e.target.closest('[data-input]');
  if (el) inputs[el.dataset.input]?.(el, e);
});
// Forms submit with Enter as well as the button.
const submits = { login: submitLogin, profile: saveProfile };
root.addEventListener('submit', e => {
  e.preventDefault();
  submits[e.target.dataset.submit]?.();
});
root.addEventListener('focusin', e => {
  if (e.target.hasAttribute('data-select-on-focus')) e.target.select();
});

window.addEventListener('keydown', e => {
  if (state.modal && e.key === 'Escape') return closeModal();
  if (state.mode !== 'kiosk' || state.step !== 'pin' || e.metaKey || e.ctrlKey || e.altKey) return;
  if (/^[0-9]$/.test(e.key)) press(e.key);
  else if (e.key === 'Backspace') press('Delete');
  else if (e.key === 'Escape') press('Clear');
});

setInterval(() => setState({ now: Date.now() }), 1000);
setInterval(() => (state.mode === 'admin' ? refresh() : state.mode === 'kiosk' && refreshKiosk()), 10000);

applyTheme(themeName(state, config));
document.documentElement.lang = getLang();
// Start in the admin dashboard if this browser still has a valid admin session.
// Without a server or database, show the kiosk with the option to try the demo.
function connect() {
  return request('GET', 'api/auth')
    .then(r => {
      if (inDemo()) return; // "Try demo" was clicked while this was loading
      if (!r.ok) throw new Error();
      setState({ offline: false });
      if (r.data.admin) return enterAdmin(r.data);
      setState({ auth: r.data });
      return refreshKiosk();
    })
    .catch(() => { if (!inDemo()) setState({ offline: true }); });
}

if (resumeDemo()) showDemo();
else {
  root.innerHTML = `<div class="boot">${t('common.loading')}</div>`;
  connect();
}
