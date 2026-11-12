import { t } from './i18n.js';

export const pad = n => String(n).padStart(2, '0');

// Localised day/month names: DN is Monday-first, DLONG is Sunday-first (Date#getDay order).
export const DN = () => t('date.dn');
export const DLONG = () => t('date.dlong');
export const MN = () => t('date.mn');
export const MLONG = () => t('date.mlong');

export const ROLES = ['Manager', 'Shift Lead', 'Barista', 'Kitchen', 'Front of House'];
export const AREAS = ['Front', 'Kitchen', 'Bar'];
export const AREA_BG = { Front: '#FFE2D3', Kitchen: '#DCEBD9', Bar: '#D9E3F0' };
export const TONES = ['#FFE2D3', '#DCEBD9', '#D9E3F0', '#F1E0B8', '#E8D9EE', '#D5ECEC', '#F3D6D0', '#E3E6C8'];

export const HOUR = 3600000, MINUTE = 60000, DAY = 864e5;

export const dkey = t => { const d = new Date(t); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
export const fromKey = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d).getTime(); };
export const sod = t => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
export const addDays = (t, n) => { const d = new Date(t); d.setDate(d.getDate() + n); return d.getTime(); };
export const weekStart = t => { const d = new Date(sod(t)); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return d.getTime(); };
export const toMin = s => { const [a, b] = s.split(':').map(Number); return a * 60 + b; };
export const at = (day, s) => { const d = new Date(sod(day)); const m = toMin(s); d.setHours(Math.floor(m / 60), m % 60, 0, 0); return d.getTime(); };
export const hm = t => { const d = new Date(t); return pad(d.getHours()) + ':' + pad(d.getMinutes()); };
export const dur = ms => { const m = Math.max(0, Math.round(ms / MINUTE)); return t('dur', { h: Math.floor(m / 60), m: pad(m % 60) }); };
export const dlabel = ts => { const d = new Date(ts); return t('date.short', { dn: DN()[(d.getDay() + 6) % 7], d: d.getDate(), mn: MN()[d.getMonth()] }); };
export const rangeLabel = ws => {
  const a = new Date(ws), b = new Date(addDays(ws, 6));
  return a.getDate() + (a.getMonth() !== b.getMonth() ? ' ' + MN()[a.getMonth()] : '') + ' – ' + b.getDate() + ' ' + MN()[b.getMonth()] + ' ' + b.getFullYear();
};

export const brkMs = (e, now) => e.breaks.reduce((s, b) => s + ((b.end || now) - b.start), 0);
export const workMs = (e, now) => Math.max(0, (e.out || now) - e.in - brkMs(e, now));
export const brkLabel = m => m === 0 ? t('brk.none') : m < 60 ? t('brk.min', { m }) : (m % 60 ? t('brk.hm', { h: Math.floor(m / 60), m: m % 60 }) : t('brk.hr', { h: m / 60 }));
export const shiftH = sh => (toMin(sh.end) - toMin(sh.start)) / 60;
export const isEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e || '');

// Roster notifications (used by /notify.js and the demo).
export const isWeekKey = k => /^\d{4}-\d{2}-\d{2}$/.test(k || '') && new Date(fromKey(k)).getDay() === 1;
export function weekShifts(data, staffId, weekStart) {
  const end = dkey(addDays(fromKey(weekStart), 6));
  return data.shifts
    .filter(x => x.staffId === staffId && x.date >= weekStart && x.date <= end)
    .sort((a, b) => a.date.localeCompare(b.date) || toMin(a.start) - toMin(b.start));
}
// Identifies exactly what was sent, so the UI can flag rosters changed since.
export const fingerprint = list => list.map(x => `${x.date} ${x.start}-${x.end} ${x.area}`).join('|');

export const initials = n => n.split(' ').filter(Boolean).map(x => x[0]).join('').slice(0, 2).toUpperCase();
export const firstName = n => n.split(' ')[0];
export const uid = () => Math.random().toString(36).slice(2, 10);
export const areaForRole = r => r === 'Kitchen' ? 'Kitchen' : r === 'Barista' ? 'Bar' : 'Front';
export const toneOf = p => TONES[(p.tone ?? 0) % TONES.length];
