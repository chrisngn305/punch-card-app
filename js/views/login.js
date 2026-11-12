import { html, raw } from '../html.js';
import { brand, headerToggles } from './common.js';
import { t } from '../i18n.js';

// Admin sign-in. On first run (no admin accounts yet) it creates the first admin.
export function loginView(v) {
  const f = v.login, setup = v.setup;
  const input = (field, type, label, auto, extra = '') => html`
    <label class="field">${label}
      <input class="input" type="${type}" data-input="loginField" data-field="${field}" value="${f[field] ?? ''}" autocomplete="${auto}" ${raw(extra)}>
    </label>`;
  return html`
<div class="login">
  <header class="kiosk-header">
    ${brand()}
    <div class="kiosk-header-tools">
      ${headerToggles(v, 'pill-btn')}
      <button class="pill-btn" data-action="backToKiosk">${t('login.back')}</button>
    </div>
  </header>
  <main class="login-main">
    <form class="card login-card" data-submit="login">
      <div>
        <h1 class="panel-title">${t(setup ? 'login.setupTitle' : 'login.title')}</h1>
        <div class="muted small mt-4">${t(setup ? 'login.setupSub' : 'login.sub')}</div>
      </div>
      ${setup && input('name', 'text', t('login.name'), 'name')}
      ${input('email', 'email', t('m.email'), 'username', 'inputmode="email" required')}
      ${input('password', 'password', t('login.password'), setup ? 'new-password' : 'current-password', 'required')}
      ${setup && input('password2', 'password', t('login.password2'), 'new-password', 'required')}
      ${setup && html`<div class="muted tiny">${t('login.passwordHint')}</div>`}
      ${v.loginError && html`<div class="alert" role="alert">${v.loginError}</div>`}
      <button type="submit" class="big-btn is-primary"${v.loginBusy ? raw(' disabled') : ''}>
        ${t(v.loginBusy ? 'login.busy' : setup ? 'login.create' : 'login.submit')}
      </button>
    </form>
  </main>
</div>`;
}
