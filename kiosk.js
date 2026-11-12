// Kiosk actions, done on the server so the browser never sees other people's
// PINs or data. Every request carries the staff member's PIN.
import { sod, dkey, toMin, brkMs, workMs, uid, MINUTE } from './js/utils.js';
import { isEmail } from './auth.js';

const openEntryFor = (data, id) => data.entries.find(e => e.staffId === id && !e.out) || null;

export const staffByPin = (data, pin) =>
  /^\d{4}$/.test(pin || '') ? data.staff.find(s => s.active && s.pin === pin) || null : null;

export const onClockCount = data => new Set(data.entries.filter(e => !e.out).map(e => e.staffId)).size;

// What the kiosk shows for the signed-in staff member.
export function meView(data, p, now = Date.now()) {
  const today = sod(now), todayK = dkey(now), open = openEntryFor(data, p.id);
  const sh = data.shifts.filter(x => x.staffId === p.id && x.date === todayK).sort((a, b) => toMin(a.start) - toMin(b.start))[0];
  return {
    id: p.id, name: p.name, role: p.role, tone: p.tone, email: p.email || '',
    status: !open ? 'off' : open.breaks.some(b => !b.end) ? 'break' : 'on',
    shift: sh ? { start: sh.start, end: sh.end } : null,
    today: data.entries.filter(e => e.staffId === p.id && e.in >= today),
    open,
  };
}

// Applies a clock action. Returns { entry } to save plus a result for the
// confirmation screen, or { error } with an i18n key.
export function clock(data, p, action, breakMinutes, now = Date.now()) {
  const e = openEntryFor(data, p.id);
  if (action === 'in') {
    if (e) return { error: 'err.alreadyIn' };
    const entry = { id: uid(), staffId: p.id, in: now, out: null, breaks: [] };
    return { entry, result: { action, at: now } };
  }
  if (!e) return { error: 'err.notIn' };
  const entry = structuredClone(e);
  if (action === 'bstart') {
    if (entry.breaks.some(b => !b.end)) return { error: 'err.onBreak' };
    entry.breaks.push({ start: now, end: null });
    return { entry, result: { action, at: now } };
  }
  if (action === 'bend') {
    const b = entry.breaks.find(x => !x.end);
    if (!b) return { error: 'err.notOnBreak' };
    b.end = now;
    return { entry, result: { action, at: now } };
  }
  if (action === 'out') {
    const recorded = Math.round(brkMs(entry, now) / MINUTE), span = now - entry.in;
    const bm = breakMinutes == null ? recorded : Math.round(Number(breakMinutes));
    if (!Number.isFinite(bm) || bm < 0 || bm * MINUTE >= span) return { error: 'cf.tooLong' };
    entry.breaks.forEach(b => { if (!b.end) b.end = now; });
    if (bm !== recorded) {
      // Replace recorded breaks with one break of the confirmed length, centred in the shift.
      const bms = Math.min(bm * MINUTE, Math.max(0, span - MINUTE));
      const st = entry.in + Math.max(0, (span - bms) / 2);
      entry.breaks = bms > 0 ? [{ start: st, end: st + bms }] : [];
      entry.breakEdited = true;
    }
    entry.out = now;
    return { entry, result: { action, at: now, in: entry.in, workedMs: workMs(entry, now), breakMin: bm } };
  }
  return { error: 'err.badAction' };
}

// Staff editing their own details. Returns { staff } or { error } (i18n key).
export function updateProfile(data, p, { name, email, newPin }) {
  name = String(name ?? '').trim();
  email = String(email ?? '').trim();
  newPin = String(newPin ?? '');
  if (!name) return { error: 'err.name' };
  if (name.length > 80) return { error: 'err.nameLong' };
  if (email && !isEmail(email)) return { error: 'err.email' };
  if (newPin && !/^\d{4}$/.test(newPin)) return { error: 'err.pinFormat' };
  if (newPin && data.staff.some(s => s.id !== p.id && s.pin === newPin)) return { error: 'err.pinUsed' };
  return { staff: { ...p, name, email, pin: newPin || p.pin } };
}
