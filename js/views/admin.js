import { html } from '../html.js';
import { brand, avatar, statusPill, weekNav, pageHead, headerToggles } from './common.js';
import { modalView } from './modal.js';
import { t } from '../i18n.js';

const TABS = ['overview', 'time', 'roster', 'staff'];

export function adminView(v) {
  return html`
<div class="admin">
  <header class="admin-header">
    <div class="admin-header-inner">
      <div class="admin-bar">
        ${brand(html`<span class="admin-badge">${t('admin.badge')}</span>`)}
        <div class="admin-bar-tools">
          <span class="mono admin-clock">${v.clockHM}</span>
          ${headerToggles(v, 'header-btn')}
          <span class="admin-who when-wide" title="${v.admin?.email}">${v.admin?.name || v.admin?.email}</span>
          <button class="header-btn is-primary" data-action="signOut" title="${t('admin.signOutHint')}">${t('admin.signOut')}</button>
        </div>
      </div>
      <nav class="tabs">
        ${TABS.map(k => html`<button class="tab ${v.tab === k ? 'is-active' : ''}" data-action="tab" data-tab="${k}">${t('tab.' + k)}</button>`)}
      </nav>
    </div>
  </header>

  <main class="admin-main">
    ${v.tab === 'overview' && overviewTab(v)}
    ${v.tab === 'time' && timesheetsTab(v)}
    ${v.tab === 'roster' && rosterTab(v)}
    ${v.tab === 'staff' && staffTab(v)}
  </main>

  ${v.modal && modalView(v)}
</div>`;
}

// ── Overview ───────────────────────────────────────────────
const overviewTab = ({ dateLong, overview: o }) => html`
<div class="stack-24">
  <div>
    <div class="eyebrow">${dateLong}</div>
    <h1 class="page-title page-title-xl">${t('ov.title')}</h1>
  </div>
  <div class="stats">
    ${o.stats.map(st => html`
    <div class="card stat">
      <div class="stat-label"><span class="dot dot-${st.dot}"></span>${st.label}</div>
      <div class="stat-value">${st.value}</div>
    </div>`)}
  </div>
  <div class="card table-card">
    <div class="table-head">
      <div class="table-title">${t('ov.live')}</div>
      <div class="muted small">${o.liveCount}</div>
    </div>
    ${o.live.map(l => html`
    <div class="live-row">
      <div class="person">
        ${avatar(l, 'sm')}
        <div class="person-text">
          <div class="strong">${l.name}</div>
          <div class="muted small">${l.role} · ${l.area}</div>
        </div>
      </div>
      <div class="live-meta">
        <div class="mono small live-shift">${l.shift}</div>
        <div class="mono small live-in">${l.inAt}</div>
        <div class="mono small live-worked">${l.worked}</div>
      </div>
      ${statusPill(l.statusKey)}
      <div class="live-action">
        ${l.canOut && html`<button class="chip-btn" data-action="adminClockOut" data-id="${l.id}">${t('ov.clockOut')}</button>`}
      </div>
    </div>`)}
  </div>
</div>`;

// ── Timesheets ─────────────────────────────────────────────
const timesheetsTab = ({ ts, staffOpts }) => html`
<div class="stack-20">
  ${pageHead(t('ts.title'), ts.label, html`
    ${weekNav('ts')}
    <select class="select-pill" data-input="tsStaff" aria-label="${t('ts.filter')}">
      <option value="all" ${ts.staff === 'all' ? 'selected' : ''}>${t('ts.allStaff')}</option>
      ${staffOpts.map(o => html`<option value="${o.id}" ${ts.staff === o.id ? 'selected' : ''}>${o.name}</option>`)}
    </select>
    <button class="btn btn-outline" data-action="addEntry">${t('ts.add')}</button>
    <button class="btn btn-solid" data-action="exportCsv">${t('ts.export')}</button>
  `)}

  <div class="summary-grid">
    ${ts.summary.map(sm => html`
    <div class="card summary">
      <div class="summary-head">${avatar(sm, 'xs')}<div class="strong ellipsis">${sm.name}</div></div>
      <div class="summary-mid">
        <div class="summary-hours">${sm.hours}<span class="unit"> h</span></div>
        <div class="mono small">${sm.pay}</div>
      </div>
      <div class="muted tiny">${t('ts.rostered', { h: sm.sched })} · <span class="variance variance-${sm.varianceKind}">${sm.variance}</span></div>
    </div>`)}
  </div>

  <div class="card table-card">
    <div class="only-wide">
      <div class="ts-grid ts-grid-head">
        <div>${t('ts.colStaff')}</div><div>${t('ts.colDate')}</div><div>${t('ts.colIn')}</div><div>${t('ts.colOut')}</div><div>${t('ts.colBreak')}</div><div>${t('ts.colHours')}</div><div>${t('ts.colPay')}</div><div></div>
      </div>
      ${ts.rows.map(r => html`
      <div class="ts-grid ts-row">
        <div class="strong ellipsis">${r.name}</div>
        <div class="ink2">${r.date}</div>
        <div class="mono small">${r.inT}</div>
        <div class="mono small ${r.active ? 'is-active-out' : ''}">${r.outT}</div>
        <div class="mono small ink2">${r.brk}</div>
        <div class="mono small strong">${r.hours}</div>
        <div class="mono small">${r.pay}</div>
        <button class="text-btn" data-action="editEntry" data-id="${r.id}">${t('ts.edit')}</button>
      </div>`)}
    </div>
    <div class="only-narrow">
      ${ts.rows.map(r => html`
      <button class="ts-card" data-action="editEntry" data-id="${r.id}">
        <div class="ts-card-main">
          <div class="strong">${r.name}</div>
          <div class="small ink2">${r.date} · <span class="mono">${r.inT}–${r.outT}</span> · ${t('ts.breakShort', { b: r.brk })}</div>
        </div>
        <div class="ts-card-side">
          <div class="mono strong">${r.hours} h</div>
          <div class="mono tiny muted">${r.pay}</div>
        </div>
      </button>`)}
    </div>
    ${ts.rows.length === 0 && html`<div class="empty">${t('ts.empty')}</div>`}
    <div class="table-foot">
      <span>${ts.count}</span>
      <span class="mono">${ts.totalHours} h · ${ts.totalPay}</span>
    </div>
  </div>
</div>`;

// ── Roster ─────────────────────────────────────────────────
const rosterTab = ({ ro, areas }) => html`
<div class="stack-20">
  ${pageHead(ro.title, ro.label, html`
    <div class="segmented view-switch" role="group" aria-label="${t('ro.viewLabel')}">
      <button class="${ro.view === 'week' ? 'is-active' : ''}" data-action="roView" data-view="week" aria-pressed="${ro.view === 'week'}">${t('ro.viewWeek')}</button>
      <button class="${ro.view === 'day' ? 'is-active' : ''}" data-action="roView" data-view="day" aria-pressed="${ro.view === 'day'}">${t('ro.viewDay')}</button>
    </div>
    ${weekNav('ro')}
    <button class="btn btn-outline" data-action="copyPrev">${t('ro.copy')}</button>
    <button class="btn btn-outline" data-action="openNotify">${t('ro.send')}</button>
    <button class="btn btn-solid" data-action="${ro.view === 'day' ? 'addShiftDay' : 'addShift'}">${t('ro.add')}</button>
  `)}

  <div class="legend">
    ${areas.map(a => html`<span class="legend-item"><span class="legend-swatch" style="background:${a.bg}"></span>${a.label}</span>`)}
  </div>

  ${ro.view === 'day' ? html`
  <div class="stack-12">
    ${dayPicker(ro)}
    ${timeline(ro)}
  </div>` : html`
  ${weekGrid(ro)}
  <div class="only-narrow stack-12">
    ${dayPicker(ro)}
    ${dayList(ro)}
  </div>`}
</div>`;

const weekGrid = ro => html`
  <div class="only-wide card roster-scroll">
    <div class="roster">
      <div class="ro-grid ro-head">
        <div class="ro-staff-cell">${t('ro.staff')}</div>
        ${ro.days.map(dy => html`<div class="ro-day ${dy.isToday ? 'is-today' : ''}">${dy.label}</div>`)}
        <div class="ro-total">${t('ro.hrs')}</div>
      </div>
      ${ro.rows.map(row => html`
      <div class="ro-grid ro-row">
        <div class="ro-staff-cell person">
          ${avatar(row, 'xs')}
          <div class="person-text">
            <div class="strong small ellipsis">${row.name}</div>
            <div class="muted tiny">${row.role}</div>
          </div>
        </div>
        ${row.cells.map(c => html`
        <div class="ro-cell ${c.isToday ? 'is-today' : ''}" data-action="addShiftCell" data-staff="${row.id}" data-date="${c.date}" title="${t('ro.addShift')}">
          ${c.shifts.map(ch => html`
          <button class="shift-chip" style="background:${ch.bg}" data-action="editShift" data-id="${ch.id}">
            <span class="shift-chip-time">${ch.time}</span>
            <span class="shift-chip-area">${ch.area}</span>
          </button>`)}
        </div>`)}
        <div class="ro-total mono strong">${row.total}</div>
      </div>`)}
      <div class="ro-grid ro-foot">
        <div class="ro-staff-cell strong">${t('ro.coverage')}</div>
        ${ro.days.map(dy => html`<div class="ro-cover mono">${dy.cover}</div>`)}
        <div class="ro-total mono strong">${ro.total}</div>
      </div>
    </div>
  </div>`;

const dayPicker = ro => html`
  <div class="day-picker">
    ${ro.days.map(dy => html`
    <button class="day-pick ${dy.selected ? 'is-selected' : dy.isToday ? 'is-today' : ''}" data-action="roPick" data-day="${dy.index}" aria-pressed="${dy.selected}">
      <span class="day-pick-short">${dy.short}</span>
      <span class="day-pick-num">${dy.num}</span>
    </button>`)}
  </div>`;

const dayList = ro => html`
  <div class="card table-card">
    <div class="day-head"><span>${ro.dayTitle}</span><span class="mono small">${ro.dayCover}</span></div>
    ${ro.dayShifts.map(ds => html`
    <button class="day-shift" data-action="editShift" data-id="${ds.id}">
      <span class="mono small strong day-shift-time">${ds.time}</span>
      <span class="strong day-shift-name">${ds.name}</span>
      <span class="area-pill" style="background:${ds.bg}">${ds.area}</span>
    </button>`)}
    ${ro.dayShifts.length === 0 && html`<div class="empty empty-sm">${t('ro.empty')}</div>`}
    <button class="add-day-btn" data-action="addShiftDay">${t('ro.addDay')}</button>
  </div>`;

// Hour-by-hour view of one day. Empty hour slots add a shift starting then.
const timeline = ({ timeline: tl, dayTitle, dayCover, date }) => html`
  <div class="card table-card">
    <div class="day-head"><span>${dayTitle}</span><span class="mono small">${dayCover}</span></div>
    ${tl.rows.length === 0 ? html`
    <div class="empty empty-sm">${t('ro.empty')}</div>
    <button class="add-day-btn" data-action="addShiftDay">${t('ro.addDay')}</button>` : html`
    <div class="tl-scroll">
      <div class="tl" style="--hours:${tl.hours.length}">
        <div class="tl-row tl-head">
          <div class="tl-name"></div>
          <div class="tl-track tl-hours">
            ${tl.hours.map(h => html`<div class="tl-hour mono">${h.label}</div>`)}
            ${tl.now && html`<div class="tl-now-label mono" style="left:${tl.now.left}">${tl.now.label}</div>`}
          </div>
          <div class="tl-total"></div>
        </div>
        ${tl.rows.map(r => html`
        <div class="tl-row">
          <div class="tl-name person">
            ${avatar(r, 'xs')}
            <div class="person-text">
              <div class="strong small ellipsis">${r.name}</div>
              <div class="muted tiny ellipsis">${r.role}</div>
            </div>
          </div>
          <div class="tl-track">
            ${tl.hours.map(h => html`<button class="tl-slot" data-action="addShiftAt" data-staff="${r.id}" data-date="${date}" data-hour="${h.h}" aria-label="${t('ro.addAt', { t: h.label + ':00', name: r.name })}" title="${t('ro.addAt', { t: h.label + ':00', name: r.name })}"></button>`)}
            ${r.bars.map(b => html`
            <button class="tl-bar" style="left:${b.left};width:${b.width};background:${b.bg}" data-action="editShift" data-id="${b.id}" title="${b.time} · ${b.area}">
              <span class="tl-bar-label">
                <span class="tl-bar-time mono">${b.time}</span>
                <span class="tl-bar-area">${b.area}</span>
              </span>
            </button>`)}
            ${tl.now && html`<div class="tl-now" style="left:${tl.now.left}"></div>`}
          </div>
          <div class="tl-total mono strong">${r.total}</div>
        </div>`)}
        <div class="tl-row tl-foot">
          <div class="tl-name strong small">${t('ro.onShift')}</div>
          <div class="tl-track tl-hours">${tl.cover.map(n => html`<div class="tl-cover mono ${n ? '' : 'is-zero'}">${n}</div>`)}</div>
          <div class="tl-total"></div>
        </div>
      </div>
    </div>`}
  </div>`;

// ── Staff ──────────────────────────────────────────────────
const staffTab = ({ staff }) => html`
<div class="stack-20">
  ${pageHead(t('st.team'), staff.title, html`
    <button class="btn btn-outline" data-action="togglePins">${staff.pinToggleLabel}</button>
    <button class="btn btn-solid" data-action="addStaff">${t('st.add')}</button>
  `)}
  <div class="card table-card">
    ${staff.rows.map(p => html`
    <div class="staff-row ${p.active ? '' : 'is-inactive'}">
      <div class="person">
        ${avatar(p, 'md')}
        <div class="person-text">
          <div class="strong">${p.name}</div>
          <div class="muted small">${p.role}</div>
        </div>
      </div>
      <div class="staff-facts">
        <div class="staff-fact"><div class="fact-label">${t('st.pin')}</div><div class="mono fact-pin">${p.pin}</div></div>
        <div class="staff-fact"><div class="fact-label">${t('st.rate')}</div><div class="mono fact-value">${p.rate}</div></div>
        <div class="staff-fact staff-fact-wide"><div class="fact-label">${t('st.week')}</div><div class="mono fact-value">${p.week}</div></div>
      </div>
      ${statusPill(p.statusKey)}
      <button class="chip-btn chip-btn-lg" data-action="editStaff" data-id="${p.id}">${t('st.edit')}</button>
    </div>`)}
  </div>
</div>`;
