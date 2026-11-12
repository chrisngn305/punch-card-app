import { t, tv, locale, getLang, LANGS } from './i18n.js';
import {
  pad, DN, DLONG, MN, MLONG, ROLES, AREAS, AREA_BG, HOUR, MINUTE, DAY,
  dkey, fromKey, sod, addDays, weekStart, toMin, at, hm, dur, dlabel, rangeLabel,
  brkMs, workMs, brkLabel, shiftH, initials, firstName, toneOf,
} from './utils.js';

export const themeName = (s, cfg) => s.theme || cfg.defaultTheme || 'dark';

export const openEntryFor = (data, staffId) => data.entries.find(e => e.staffId === staffId && !e.out);

export const timesheetWeekStart = s => addDays(weekStart(s.now), 7 * s.tsWeek);
export const rosterWeekStart = s => addDays(weekStart(s.now), 7 * s.roWeek);

// Entries shown on the Timesheets tab (shared with CSV export).
export function timesheetEntries(s) {
  const { staff, entries } = s.data;
  const byId = Object.fromEntries(staff.map(x => [x.id, x]));
  const from = timesheetWeekStart(s), to = addDays(from, 7);
  return entries
    .filter(e => e.in >= from && e.in < to && byId[e.staffId] && (s.tsStaff === 'all' || e.staffId === s.tsStaff))
    .sort((a, b) => b.in - a.in)
    .map(e => ({ e, p: byId[e.staffId], h: workMs(e, s.now) / HOUR }));
}

const person = p => ({ name: p.name, role: tv('role', p.role), initials: initials(p.name), tone: toneOf(p) });

export function buildView(s, cfg) {
  const base = commonView(s, cfg);
  if (s.mode === 'admin') return s.data ? { ...base, ...buildAdminView(s, cfg) } : { ...base, loading: true };
  if (s.mode === 'login') return { ...base, ...buildLoginView(s) };
  return { ...base, ...buildKioskView(s, cfg) };
}

// Header, clock and toast: shared by every screen.
function commonView(s, cfg) {
  const d = new Date(s.now), tn = themeName(s, cfg);
  return {
    mode: s.mode, toast: s.toast, demo: s.demo, offline: s.offline,
    themeLabel: t(tn === 'dark' ? 'common.lightMode' : 'common.darkMode'),
    langLabel: LANGS[getLang() === 'vi' ? 'en' : 'vi'], langCode: getLang() === 'vi' ? 'en' : 'vi',
    isDark: tn === 'dark',
    dateLong: t('date.long', { dlong: DLONG()[d.getDay()], d: d.getDate(), mlong: MLONG()[d.getMonth()], y: d.getFullYear() }),
    clockHM: pad(d.getHours()) + ':' + pad(d.getMinutes()), clockS: pad(d.getSeconds()),
    admin: s.auth?.admin || null,
  };
}

// Admin sign-in, or first-run account setup.
function buildLoginView(s) {
  return { setup: !!s.auth?.setupNeeded, login: s.login, loginError: s.loginError, loginBusy: !!s.loginBusy };
}

// Kiosk: built only from the signed-in staff member's own record (s.me, from the server).
function buildKioskView(s, cfg) {
  const now = s.now, today = sod(now), mp = s.me;
  let me = null, actions = [], cf = null;
  if (mp) {
    const stt = mp.status;
    me = {
      ...person(mp), first: firstName(mp.name), statusKey: stt, email: mp.email,
      shift: mp.shift ? `${mp.shift.start}–${mp.shift.end}` : t('me.notRostered'),
      worked: dur(mp.today.reduce((a, e) => a + workMs(e, now), 0)),
    };
    actions = stt === 'off' ? [{ label: t('act.in'), primary: true, type: 'in' }]
      : stt === 'on' ? [{ label: t('act.bstart'), type: 'bstart' }, { label: t('act.out'), primary: true, type: 'out' }]
        : [{ label: t('act.bend'), primary: true, type: 'bend' }, { label: t('act.out'), type: 'out' }];

    const oe = mp.open;
    if (oe) {
      const rec = Math.round(brkMs(oe, now) / MINUTE);
      const vals = Array.from(new Set([0, 15, 30, 45, 60, rec])).sort((a, b) => a - b);
      const span = now - oe.in;
      cf = {
        first: me.first, inT: hm(oe.in), inDate: sod(oe.in) === today ? t('cf.today') : dlabel(oe.in), outT: hm(now),
        total: dur(Math.max(0, span - s.cfBrk * MINUTE)),
        note: rec === 0 ? (s.cfBrk === 0 ? t('cf.noneRecorded') : t('cf.added'))
          : t(s.cfBrk === rec ? 'cf.recorded' : 'cf.changed', { brk: brkLabel(rec).toLowerCase() }),
        noteWarn: rec === 0 && s.cfBrk === 0,
        custom: s.cfText != null ? s.cfText : String(s.cfBrk),
        isCustom: !vals.includes(s.cfBrk),
        tooLong: s.cfBrk * MINUTE >= span,
        opts: vals.map(v => ({ value: v, label: brkLabel(v) + (v === rec && rec > 0 ? ' · ' + t('cf.recordedTag') : ''), selected: v === s.cfBrk })),
      };
    }
  }
  return {
    step: s.step, busy: !!s.busy,
    onNowLabel: t('kiosk.onNow', { n: s.onClock ?? 0 }),
    pinTitle: t('pin.title'),
    pinMsg: s.pinError ? (s.pinErrorMsg || t('pin.error')) : t('pin.msg'),
    pinError: s.pinError,
    dots: [0, 1, 2, 3].map(i => s.pinError ? 'is-error' : i < s.pin.length ? 'is-filled' : ''),
    me, actions, cf, done: s.done,
    pf: s.pf && { ...s.pf, error: s.pfError, busy: !!s.pfBusy },
    showHints: s.demo || cfg.showDemoHints,
  };
}

function buildAdminView(s, cfg) {
  const { staff, entries, shifts } = s.data, now = s.now, cur = cfg.currency;
  const money = v => cur + v.toFixed(2);
  const byId = Object.fromEntries(staff.map(x => [x.id, x]));
  const today = sod(now), todayK = dkey(now), curWs = weekStart(now);
  const openE = id => openEntryFor(s.data, id);
  const statusOf = id => { const e = openE(id); if (!e) return 'off'; return e.breaks.some(b => !b.end) ? 'break' : 'on'; };
  const workedSince = (id, from, to) => entries.filter(e => e.staffId === id && e.in >= from && e.in < to).reduce((a, e) => a + workMs(e, now), 0);

  // ── Overview ─────────────────────────────────────────────
  const todayShifts = shifts.filter(x => x.date === todayK);
  const liveIds = Array.from(new Set(todayShifts.map(x => x.staffId)
    .concat(entries.filter(e => !e.out || e.in >= today).map(e => e.staffId)))).filter(id => byId[id]);
  const ORDER = { break: 0, on: 1, late: 2, upcoming: 3, done: 4, off: 5 };
  let late = 0;
  const live = liveIds.map(id => {
    const p = byId[id], sh = todayShifts.find(x => x.staffId === id), stt = statusOf(id);
    const todays = entries.filter(e => e.staffId === id && e.in >= today);
    let key = stt;
    if (stt === 'off') {
      if (todays.length) key = 'done';
      else if (sh && at(now, sh.start) + 5 * MINUTE < now && at(now, sh.end) > now) { key = 'late'; late++; }
      else if (sh && at(now, sh.start) > now) key = 'upcoming';
    }
    const first = todays.length ? Math.min(...todays.map(e => e.in)) : null, oe = openE(id);
    return {
      id, ...person(p), statusKey: key, order: ORDER[key], sortT: sh ? toMin(sh.start) : 9999,
      area: tv('area', sh ? sh.area : 'Unrostered'), shift: sh ? `${sh.start}–${sh.end}` : t('ov.noShift'),
      inAt: first ? t('ov.in', { t: hm(first) }) + (oe ? '' : t('ov.out', { t: hm(Math.max(...todays.map(e => e.out))) })) : t('ov.notIn'),
      worked: todays.length ? dur(workedSince(id, today, today + DAY)) : t('ov.noTime'),
      canOut: !!oe,
    };
  }).sort((a, b) => a.order - b.order || a.sortT - b.sortT);

  const weekCost = staff.reduce((a, p) => a + workedSince(p.id, curWs, addDays(curWs, 7)) / HOUR * p.rate, 0);
  const hoursToday = staff.reduce((a, p) => a + workedSince(p.id, today, today + DAY), 0) / HOUR;
  const stats = [
    { label: t('ov.onShift'), value: String(staff.filter(x => statusOf(x.id) === 'on').length), dot: 'green' },
    { label: t('ov.onBreak'), value: String(staff.filter(x => statusOf(x.id) === 'break').length), dot: 'amber' },
    { label: t('ov.late'), value: String(late), dot: late ? 'accent' : 'neutral' },
    { label: t('ov.hoursToday'), value: hoursToday.toFixed(1), dot: 'neutral' },
    { label: t('ov.cost'), value: cur + Math.round(weekCost).toLocaleString(locale()), dot: 'neutral' },
  ];

  // ── Timesheets ───────────────────────────────────────────
  const tsWs = timesheetWeekStart(s);
  const tsEntries = timesheetEntries(s);
  const tsRows = tsEntries.map(({ e, p, h }) => ({
    id: e.id, name: p.name, date: dlabel(e.in), inT: hm(e.in), outT: e.out ? hm(e.out) : t('ts.active'), active: !e.out,
    brk: Math.round(brkMs(e, now) / MINUTE) + 'm' + (e.breakEdited ? '*' : ''),
    hours: h.toFixed(2), pay: money(h * p.rate),
  }));
  const wsK = dkey(tsWs), weK = dkey(addDays(tsWs, 6));
  const summary = staff.filter(p => s.tsStaff === 'all' || p.id === s.tsStaff).map(p => {
    const h = tsEntries.filter(r => r.p.id === p.id).reduce((a, r) => a + r.h, 0);
    const sch = shifts.filter(x => x.staffId === p.id && x.date >= wsK && x.date <= weK).reduce((a, x) => a + shiftH(x), 0);
    const v = h - sch;
    return {
      has: h > 0 || sch > 0, ...person(p), hours: h.toFixed(1), pay: money(h * p.rate), sched: sch.toFixed(1),
      variance: (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(1) + ' h',
      varianceKind: Math.abs(v) < 0.5 ? 'even' : v > 0 ? 'over' : 'under',
    };
  }).filter(x => x.has);
  const totH = tsEntries.reduce((a, r) => a + r.h, 0), totP = tsEntries.reduce((a, r) => a + r.h * r.p.rate, 0);
  const ts = {
    label: rangeLabel(tsWs), staff: s.tsStaff, rows: tsRows, summary,
    count: t('ts.count', { n: tsRows.length }),
    totalHours: totH.toFixed(2), totalPay: money(totP),
  };

  // ── Roster ───────────────────────────────────────────────
  const roWs = rosterWeekStart(s);
  const days = [0, 1, 2, 3, 4, 5, 6].map(i => {
    const t = addDays(roWs, i), k = dkey(t), dsh = shifts.filter(x => x.date === k && byId[x.staffId]);
    return {
      index: i, k, t, label: DN()[i] + ' ' + new Date(t).getDate(), short: DN()[i], num: String(new Date(t).getDate()),
      isToday: k === todayK, selected: i === s.roDay,
      cover: dsh.length + ' · ' + dsh.reduce((a, x) => a + shiftH(x), 0) + 'h', dsh,
    };
  });
  const roStaff = staff.filter(p => p.active || shifts.some(x => x.staffId === p.id && x.date >= days[0].k && x.date <= days[6].k));
  const chip = x => ({ id: x.id, time: `${x.start}–${x.end}`, area: tv('area', x.area), bg: AREA_BG[x.area] || '#ECE8DE' });
  let roTotal = 0, roCost = 0;
  const roRows = roStaff.map(p => {
    let tot = 0;
    const cells = days.map(dy => {
      const list = dy.dsh.filter(x => x.staffId === p.id).sort((a, b) => toMin(a.start) - toMin(b.start));
      list.forEach(x => { tot += shiftH(x); });
      return { date: dy.k, isToday: dy.isToday, shifts: list.map(chip) };
    });
    roTotal += tot; roCost += tot * p.rate;
    return { id: p.id, ...person(p), cells, total: tot + 'h' };
  });
  const sd = days[s.roDay], sdt = new Date(sd.t);
  const ro = {
    label: rangeLabel(roWs), title: t('ro.title', { h: roTotal, cost: cur + Math.round(roCost).toLocaleString(locale()) }),
    days, rows: roRows, total: roTotal + 'h',
    dayTitle: t('date.dayTitle', { dlong: DLONG()[sdt.getDay()], d: sdt.getDate(), mn: MN()[sdt.getMonth()] }), dayCover: sd.cover,
    dayShifts: sd.dsh.slice().sort((a, b) => toMin(a.start) - toMin(b.start)).map(x => ({ ...chip(x), name: byId[x.staffId].name })),
    view: s.roView, date: sd.k,
  };

  // Day timeline: shifts laid out on an hour axis (06:00–22:00, widened to fit).
  const fromH = Math.min(6, ...sd.dsh.map(x => Math.floor(toMin(x.start) / 60)));
  const toH = Math.min(24, Math.max(22, ...sd.dsh.map(x => Math.ceil(toMin(x.end) / 60))));
  const spanM = (toH - fromH) * 60;
  const pct = m => (((m - fromH * 60) / spanM) * 100).toFixed(3) + '%';
  const hourList = Array.from({ length: toH - fromH }, (_, i) => fromH + i);
  const nowM = Math.round((now - today) / MINUTE);
  ro.timeline = {
    hours: hourList.map(h => ({ h, label: pad(h) })),
    rows: roStaff.map(p => {
      const list = sd.dsh.filter(x => x.staffId === p.id).sort((a, b) => toMin(a.start) - toMin(b.start));
      const hrs = list.reduce((a, x) => a + shiftH(x), 0);
      return {
        id: p.id, ...person(p), first: list.length ? toMin(list[0].start) : Infinity, total: hrs ? hrs + 'h' : '',
        bars: list.map(x => ({ ...chip(x), left: pct(toMin(x.start)), width: pct(fromH * 60 + toMin(x.end) - toMin(x.start)) })),
      };
    }).filter(r => r.bars.length) // only people working that day
      .sort((a, b) => a.first - b.first || a.name.localeCompare(b.name)),
    cover: hourList.map(h => sd.dsh.filter(x => toMin(x.start) < (h + 1) * 60 && toMin(x.end) > h * 60).length),
    now: sd.isToday && nowM >= fromH * 60 && nowM <= toH * 60 ? { left: pct(nowM), label: hm(now) } : null,
  };

  // ── Staff ────────────────────────────────────────────────
  const staffRows = staff.slice().sort((a, b) => (b.active - a.active) || a.name.localeCompare(b.name)).map(p => ({
    id: p.id, ...person(p), active: p.active, statusKey: p.active ? statusOf(p.id) : 'inactive',
    pin: s.showPins ? p.pin : '••••', rate: money(+p.rate) + '/h',
    week: (workedSince(p.id, curWs, addDays(curWs, 7)) / HOUR).toFixed(1) + ' h',
  }));

  // ── Modal ────────────────────────────────────────────────
  const m = s.modal;
  const staffOpts = staff.filter(p => p.active || (m && s.form.staffId === p.id)).map(p => ({ id: p.id, name: p.name }));
  const titles = { shift: ['m.newShift', 'm.editShift'], entry: ['m.addEntry', 'm.editEntry'], staff: ['m.addStaff', 'm.editStaff'] };

  // Send-roster dialog
  let notify = null;
  if (m && m.type === 'notify' && s.notify) {
    const n = s.notify, d = n.data, when = ts => dlabel(ts) + ' ' + hm(ts);
    const STATUS = { sent: ['nt.sent', 'on'], preview: ['nt.preview', 'off'], failed: ['nt.failed', 'late'] };
    notify = {
      title: t('nt.title', { range: rangeLabel(fromKey(n.week)) }),
      loading: !!n.loading, error: !!n.error, sending: !!n.sending,
      configured: !!d?.email.configured, from: d?.email.from || '', demo: !!d?.email.demo,
      rows: (d?.recipients || []).map(r => {
        const p = byId[r.staffId], st = r.last && STATUS[r.last.status];
        const hasEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email || '');
        return {
          id: r.staffId, ...(p ? person(p) : { name: r.name, role: '', initials: initials(r.name), tone: '#ECE8DE' }),
          email: hasEmail ? r.email : '', info: t('nt.shifts', { n: r.shifts, h: +r.hours.toFixed(2) }),
          status: r.changed ? t('nt.changed') : st ? t(st[0], { when: when(r.last.sentAt) }) : t('nt.notSent'),
          statusKind: r.changed ? 'break' : st ? st[1] : 'off',
          error: r.last?.status === 'failed' ? r.last.error : '',
          checked: n.selected.includes(r.staffId), disabled: !hasEmail || !!n.sending,
        };
      }),
      count: n.selected.length,
    };
    notify.empty = !notify.loading && !notify.error && notify.rows.length === 0;
  }

  return {
    tab: s.tab,
    overview: { stats, live, liveCount: t('ov.people', { n: live.length }) },
    ts, ro,
    staff: { rows: staffRows, title: t('st.active', { n: staff.filter(p => p.active).length }), pinToggleLabel: t(s.showPins ? 'st.hidePins' : 'st.showPins') },
    staffOpts,
    areas: AREAS.map(a => ({ name: a, label: tv('area', a), bg: AREA_BG[a] })),
    roles: ROLES.map(r => ({ value: r, label: tv('role', r) })),

    notify,
    modal: m && {
      type: m.type, form: s.form, error: s.formError, canDelete: !!m.id,
      title: m.type === 'notify' ? notify?.title : t(titles[m.type][m.id ? 1 : 0]),
      saveLabel: m.type === 'notify' ? (notify?.sending ? t('nt.sending') : t('nt.send', { n: notify?.count || 0 })) : t('m.save'),
      saveDisabled: m.type === 'notify' && (!notify || !notify.count || notify.sending || notify.loading),
    },
  };
}
