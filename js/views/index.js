import { html } from '../html.js';
import { kioskView } from './kiosk.js';
import { adminView } from './admin.js';
import { loginView } from './login.js';
import { t } from '../i18n.js';

export function appView(v) {
  return html`
    ${v.mode === 'kiosk' ? kioskView(v)
      : v.mode === 'login' ? loginView(v)
        : v.loading ? html`<div class="boot">${t('common.loading')}</div>` : adminView(v)}
    ${v.toast && html`<div class="toast" role="status">${v.toast}</div>`}
  `;
}
