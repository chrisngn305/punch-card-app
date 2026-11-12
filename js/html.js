// Tagged template that escapes interpolated values unless they are already
// safe markup (the result of another `html` call or `raw`).
class Safe {
  constructor(s) { this.s = s; }
  toString() { return this.s; }
}

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escape = v => String(v).replace(/[&<>"']/g, c => ESC[c]);

const stringify = v =>
  v == null || v === false ? ''
    : v instanceof Safe ? v.s
      : Array.isArray(v) ? v.map(stringify).join('')
        : escape(v);

export const html = (strings, ...vals) =>
  new Safe(strings.reduce((out, s, i) => out + s + (i < vals.length ? stringify(vals[i]) : ''), ''));

export const raw = s => new Safe(s);
