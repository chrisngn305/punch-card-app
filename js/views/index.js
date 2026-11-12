import { html } from '../html.js';
import { kioskView } from './kiosk.js';
import { adminView } from './admin.js';
import { loginView } from './login.js';
import { t } from '../i18n.js';

export function appView(v) {
  return html`
    ${v.demo && demoBar()}
    ${v.mode === 'kiosk' ? kioskView(v)
      : v.mode === 'login' ? loginView(v)
        : v.loading ? html`<div class="boot">${t('common.loading')}</div>` : adminView(v)}
    ${v.toast && html`<div class="toast" role="status">${v.toast}</div>`}
  `;
}

const demoBar = () => html`
  <div class="demo-bar" role="status">
    <span class="demo-tag">${t('demo.badge')}</span>
    <span class="demo-text">${t('demo.banner')}</span>
    <span class="demo-tools">
      <button class="text-btn" data-action="resetDemo">${t('demo.reset')}</button>
      <button class="text-btn" data-action="exitDemo">${t('demo.exit')}</button>
    </span>
  </div>`;
