import { html } from '../html.js';
import { brand, avatar, statusPill, headerToggles } from './common.js';
import { t } from '../i18n.js';
import { raw } from '../html.js';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'Clear', '0', 'Delete'];
const KEY_LABEL = { Clear: 'kiosk.clear', Delete: 'kiosk.delete' };

export function kioskView(v) {
  return html`
<div class="kiosk">
  <header class="kiosk-header">
    ${brand()}
    <div class="kiosk-header-tools">
      <span class="on-now"><span class="dot dot-green"></span>${v.onNowLabel}</span>
      ${headerToggles(v, 'pill-btn')}
      ${!v.demo && html`<button class="pill-btn" data-action="tryDemo">${t('demo.try')}</button>`}
      <button class="pill-btn" data-action="openAdmin">${t('kiosk.admin')}</button>
    </div>
  </header>

  <main class="kiosk-main">
    <section class="kiosk-clock">
      <div class="eyebrow eyebrow-lg">${v.dateLong}</div>
      <div class="clock">
        <span class="clock-hm">${v.clockHM}</span>
        <span class="clock-s">${v.clockS}</span>
      </div>
      <div class="kiosk-lede">${t('kiosk.lede')}</div>
    </section>

    <section class="kiosk-panel">
      ${v.offline && v.step === 'pin' && html`
      <div class="notice demo-offer">
        <span>${t('demo.noServer')}</span>
        <button class="btn btn-accent" data-action="tryDemo">${t('demo.try')}</button>
      </div>`}
      ${v.step === 'pin' && pinPad(v)}
      ${v.step === 'staff' && v.me && staffPanel(v)}
      ${v.step === 'profile' && v.pf && profilePanel(v.pf)}
      ${v.step === 'confirm' && v.cf && confirmPanel(v.cf)}
      ${v.step === 'done' && donePanel(v.done)}
    </section>
  </main>

  ${v.showHints && html`
  <footer class="kiosk-hints">
    <span>${t('kiosk.demoPins')}</span><span>Maya 1234</span><span>Tomás 2580</span><span>Priya 7777</span>
  </footer>`}
</div>`;
}

const pinPad = v => html`
<div class="pin-pad">
  <div class="pin-head">
    <div class="pin-title">${v.pinTitle}</div>
    <div class="pin-dots">${v.dots.map(cls => html`<div class="pin-dot ${cls}"></div>`)}</div>
    <div class="pin-msg ${v.pinError ? 'is-error' : ''}" aria-live="polite">${v.pinMsg}</div>
  </div>
  <div class="keypad">
    ${KEYS.map(k => html`<button class="key ${k.length > 1 ? 'key-fn' : ''}" data-action="press" data-key="${k}">${KEY_LABEL[k] ? t(KEY_LABEL[k]) : k}</button>`)}
  </div>
</div>`;

const staffPanel = ({ me, actions, busy }) => html`
<div class="stack-20">
  <div class="card kiosk-card">
    <div class="me-head">
      ${avatar(me, 'lg')}
      <div class="me-text">
        <div class="me-name">${t('me.hi', { name: me.first })}</div>
        <div class="muted small">${me.role}</div>
      </div>
      ${statusPill(me.statusKey)}
    </div>
    <div class="split">
      <div><div class="label-caps">${t('me.todayShift')}</div><div class="mono split-value">${me.shift}</div></div>
      <div><div class="label-caps">${t('me.worked')}</div><div class="mono split-value">${me.worked}</div></div>
    </div>
  </div>
  <div class="stack-10">
    ${actions.map(a => html`<button class="big-btn ${a.primary ? 'is-primary' : ''}" data-action="act" data-type="${a.type}"${busy ? raw(' disabled') : ''}>${a.label}</button>`)}
  </div>
  <div class="kiosk-links">
    <button class="link-btn" data-action="openProfile">${t('pf.open')}</button>
    <button class="link-btn" data-action="resetKiosk">${t('me.notYou')}</button>
  </div>
</div>`;

const confirmPanel = cf => html`
<div class="stack-14">
  <div class="card kiosk-card">
    <div>
      <div class="panel-title">${t('cf.title')}</div>
      <div class="muted small mt-4">${t('cf.sub', { name: cf.first })}</div>
    </div>
    <div class="split">
      <div>
        <div class="label-caps">${t('cf.clockedIn')}</div>
        <div class="split-time">${cf.inT}</div>
        <div class="muted tiny">${cf.inDate}</div>
      </div>
      <div>
        <div class="label-caps">${t('cf.clockingOut')}</div>
        <div class="split-time">${cf.outT}</div>
        <div class="muted tiny">${t('cf.now')}</div>
      </div>
    </div>
    <div class="stack-10">
      <div class="cf-note-row">
        <div class="label-caps">${t('cf.breakTaken')}</div>
        <div class="cf-note ${cf.noteWarn ? 'is-warn' : ''}">${cf.note}</div>
      </div>
      <div class="cf-opts">
        ${cf.opts.map(o => html`<button class="opt-btn ${o.selected ? 'is-selected' : ''}" data-action="cfOpt" data-value="${o.value}">${o.label}</button>`)}
      </div>
      <div class="cf-custom">
        <span class="muted small">${t('cf.custom')}</span>
        <button class="step-btn" data-action="cfMinus" aria-label="${t('cf.less')}">−</button>
        <div class="cf-field ${cf.isCustom ? 'is-custom' : ''}">
          <input type="number" inputmode="numeric" min="0" max="600" value="${cf.custom}" data-input="cfInput" data-select-on-focus aria-label="${t('cf.minutes')}">
          <span class="muted small">${t('cf.min')}</span>
        </div>
        <button class="step-btn" data-action="cfPlus" aria-label="${t('cf.more')}">+</button>
      </div>
    </div>
    ${cf.tooLong && html`<div class="alert">${t('cf.tooLong')}</div>`}
    <div class="cf-total">
      <div class="strong">${t('cf.total')}</div>
      <div class="cf-total-value">${cf.total}</div>
    </div>
  </div>
  <button class="big-btn is-primary" data-action="confirmOut" ${cf.tooLong ? 'disabled' : ''}>${t('cf.confirm')}</button>
  <button class="big-btn is-quiet" data-action="backToStaff">${t('cf.back')}</button>
</div>`;

const donePanel = done => html`
<div class="done-card" role="status">
  <div class="done-verb">${done.verb}</div>
  <div class="done-time">${done.time}</div>
  <div class="done-line">${done.line}</div>
  <button class="done-btn" data-action="resetKiosk">${t('done.btn')}</button>
</div>`;

// Staff updating their own details. The PIN fields are optional: blank keeps the current PIN.
const profilePanel = pf => html`
<form class="stack-14" data-submit="profile" autocomplete="off">
  <div class="card kiosk-card">
    <div>
      <div class="panel-title">${t('pf.title')}</div>
      <div class="muted small mt-4">${t('pf.sub')}</div>
    </div>
    <label class="field">${t('m.name')}
      <input class="input" data-input="pfField" data-field="name" value="${pf.name}" autocomplete="name" maxlength="80">
    </label>
    <label class="field">${t('m.email')}
      <input class="input" type="email" inputmode="email" data-input="pfField" data-field="email" value="${pf.email}" placeholder="${t('m.emailPh')}" autocomplete="email">
    </label>
    <div class="grid-2">
      <label class="field">${t('pf.newPin')}
        <input class="input input-pin" type="password" inputmode="numeric" maxlength="4" data-input="pfField" data-field="pin" value="${pf.pin}" autocomplete="new-password">
      </label>
      <label class="field">${t('pf.newPin2')}
        <input class="input input-pin" type="password" inputmode="numeric" maxlength="4" data-input="pfField" data-field="pin2" value="${pf.pin2}" autocomplete="new-password">
      </label>
    </div>
    <div class="muted tiny">${t('pf.pinHint')}</div>
    ${pf.error && html`<div class="alert" role="alert">${pf.error}</div>`}
  </div>
  <button type="submit" class="big-btn is-primary"${pf.busy ? raw(' disabled') : ''}>${t('pf.save')}</button>
  <button type="button" class="big-btn is-quiet" data-action="cancelProfile">${t('cf.back')}</button>
</form>`;
