import { html, raw } from '../html.js';
import { t } from '../i18n.js';

export const brand = (extra = '') => html`
  <div class="brand">
    <div class="brand-mark"></div>
    <span class="brand-name">Punchcard</span>
    ${extra}
  </div>`;

const SUN = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
const MOON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';

// Language + theme toggles. On phones they collapse to "VI"/"EN" and an icon.
export const headerToggles = (v, cls) => html`
  <button class="${cls} hdr-toggle" data-action="toggleLang" lang="${v.langCode}" title="${v.langLabel}" aria-label="${v.langLabel}">
    <span class="when-wide">${v.langLabel}</span><span class="when-narrow">${v.langCode.toUpperCase()}</span>
  </button>
  <button class="${cls} hdr-toggle" data-action="toggleTheme" title="${v.themeLabel}" aria-label="${v.themeLabel}">
    <span class="when-wide">${v.themeLabel}</span><span class="when-narrow icon">${raw(v.isDark ? SUN : MOON)}</span>
  </button>`;

export const avatar = (p, size) =>
  html`<div class="avatar avatar-${size}" style="background:${p.tone}">${p.initials}</div>`;

export const statusPill = key =>
  html`<span class="status status-${key}">${t('status.' + key)}</span>`;

export const weekNav = prefix => html`
  <div class="segmented">
    <button data-action="${prefix}Prev">${t('week.prev')}</button>
    <button data-action="${prefix}This">${t('week.this')}</button>
    <button data-action="${prefix}Next">${t('week.next')}</button>
  </div>`;

export const pageHead = (eyebrow, title, tools) => html`
  <div class="page-head">
    <div>
      <div class="eyebrow">${eyebrow}</div>
      <h1 class="page-title">${title}</h1>
    </div>
    <div class="toolbar">${tools}</div>
  </div>`;
