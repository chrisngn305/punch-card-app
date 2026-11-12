import { html, raw } from '../html.js';
import { t } from '../i18n.js';

const sel = on => on ? raw(' selected') : '';

const field = (label, control) => html`<label class="field">${label}${control}</label>`;

const input = (key, value, attrs = '') =>
  html`<input class="input" data-input="field" data-field="${key}" value="${value ?? ''}" ${raw(attrs)}>`;

const select = (key, value, options) => html`
  <select class="input" data-input="field" data-field="${key}">
    ${options.map(o => html`<option value="${o.value}"${sel(o.value === value)}>${o.label}</option>`)}
  </select>`;

const staffSelect = (f, staffOpts) => field(t('m.staff'), select('staffId', f.staffId, staffOpts.map(o => ({ value: o.id, label: o.name }))));

const shiftForm = (f, v) => html`
<div class="stack-12">
  ${staffSelect(f, v.staffOpts)}
  ${field(t('m.date'), input('date', f.date, 'type="date"'))}
  <div class="grid-2">
    ${field(t('m.start'), input('start', f.start, 'type="time"'))}
    ${field(t('m.end'), input('end', f.end, 'type="time"'))}
  </div>
  ${field(t('m.area'), select('area', f.area, v.areas.map(a => ({ value: a.name, label: a.label }))))}
</div>`;

const entryForm = (f, v) => html`
<div class="stack-12">
  ${staffSelect(f, v.staffOpts)}
  ${field(t('m.date'), input('date', f.date, 'type="date"'))}
  <div class="grid-3">
    ${field(t('m.in'), input('in', f.in, 'type="time"'))}
    ${field(t('m.out'), input('out', f.out, 'type="time"'))}
    ${field(t('m.brk'), input('brk', f.brk, 'type="number" min="0" step="5"'))}
  </div>
  <div class="muted small">${t('m.openHint')}</div>
</div>`;

const staffForm = (f, v) => html`
<div class="stack-12">
  ${field(t('m.name'), html`<input class="input" data-input="field" data-field="name" value="${f.name ?? ''}" placeholder="${t('m.namePh')}">`)}
  ${field(t('m.role'), select('role', f.role, v.roles))}
  <div class="grid-2 stack-on-xs">
    ${field(t('m.pin'), html`
      <div class="pin-field">
        <input class="input input-pin" data-input="field" data-field="pin" value="${f.pin ?? ''}" inputmode="numeric" maxlength="4">

        <button type="button" class="pin-new" data-action="randomPin">${t('m.newPin')}</button>
      </div>`)}
    ${field(t('m.rate'), input('rate', f.rate, 'type="number" step="0.5" min="0"'))}
  </div>
  <div class="grid-2 stack-on-xs">
    ${field(t('m.email'), html`<input class="input" type="email" inputmode="email" autocomplete="off" data-input="field" data-field="email" value="${f.email ?? ''}" placeholder="${t('m.emailPh')}">`)}
    ${field(t('m.phone'), html`<input class="input" type="tel" inputmode="tel" autocomplete="off" data-input="field" data-field="phone" value="${f.phone ?? ''}">`)}
  </div>
  <div class="muted tiny">${t('m.phoneHint')}</div>
  <label class="check">
    <input type="checkbox" data-input="field" data-field="active"${f.active ? raw(' checked') : ''}>
    ${t('m.activeCheck')}
  </label>
</div>`;

const notifyForm = (f, v) => {
  const n = v.notify;
  if (!n || n.loading) return html`<div class="empty empty-sm">${t('nt.loading')}</div>`;
  if (n.error) return html`<div class="alert" role="alert">${t('nt.loadFailed')}</div>`;
  return html`
<div class="stack-12">
  <div class="muted small">${t('nt.intro')}</div>
  ${n.configured
    ? html`<div class="muted small">${t('nt.from', { from: n.from })}</div>`
    : html`<div class="notice">${t('nt.notConfigured')}</div>`}
  ${n.empty ? html`<div class="empty empty-sm">${t('nt.empty')}</div>` : html`
  <div class="nt-pick">
    <button type="button" class="text-btn" data-action="notifyPick" data-mode="needed">${t('nt.selectNeeded')}</button>
    <button type="button" class="text-btn" data-action="notifyPick" data-mode="all">${t('nt.selectAll')}</button>
    <button type="button" class="text-btn" data-action="notifyPick" data-mode="none">${t('nt.selectNone')}</button>
  </div>
  <div class="nt-list">
    ${n.rows.map(r => html`
    <label class="nt-row ${r.disabled && !n.sending ? 'is-disabled' : ''}">
      <input type="checkbox" data-input="notifyToggle" data-id="${r.id}"${r.checked ? raw(' checked') : ''}${r.disabled ? raw(' disabled') : ''}>
      <div class="avatar avatar-xs" style="background:${r.tone}">${r.initials}</div>
      <div class="nt-main">
        <div class="strong ellipsis">${r.name}</div>
        <div class="small ellipsis ${r.email ? 'muted' : 'nt-warn'}">${r.email || t('nt.noEmail')}</div>
        <div class="tiny muted">${r.info}</div>
        ${r.error && html`<div class="tiny nt-warn ellipsis" title="${r.error}">${r.error}</div>`}
      </div>
      <span class="status status-${r.statusKind}">${r.status}</span>
    </label>`)}
  </div>`}
</div>`;
};

const FORMS = { shift: shiftForm, entry: entryForm, staff: staffForm, notify: notifyForm };

export function modalView(v) {
  const m = v.modal;
  return html`
<div class="modal-backdrop" data-action="closeModal">
  <div class="modal" data-action="noop" role="dialog" aria-modal="true" aria-label="${m.title}">
    <div class="modal-head">
      <div class="modal-title">${m.title}</div>
      <button class="modal-close" data-action="closeModal" aria-label="${t('m.close')}">×</button>
    </div>
    ${FORMS[m.type](m.form, v)}
    ${m.error && html`<div class="alert" role="alert">${m.error}</div>`}
    <div class="modal-foot">
      ${m.canDelete && html`<button class="btn btn-danger" data-action="deleteItem">${t('m.delete')}</button>`}
      <div class="spacer"></div>
      <button class="btn btn-ghost" data-action="closeModal">${t('m.cancel')}</button>
      <button class="btn btn-accent" data-action="saveModal"${m.saveDisabled ? raw(' disabled') : ''}>${m.saveLabel}</button>
    </div>
  </div>
</div>`;
}
