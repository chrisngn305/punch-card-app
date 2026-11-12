// Roster notifications: builds each person's "your shifts this week" email
// and sends it over SMTP. Without SMTP_HOST set, emails are only printed to
// the server log (status "preview") so nothing leaves the machine.
import { t, tv, setLang, LANGS } from './js/i18n.js';
import { dkey, fromKey, addDays, rangeLabel, dlabel, shiftH, toMin } from './js/utils.js';

const env = process.env;

export const emailConfig = () => ({
  configured: !!env.SMTP_HOST,
  from: env.MAIL_FROM || env.SMTP_USER || '',
});

let transport;
async function getTransport() {
  if (!transport) {
    const { default: nodemailer } = await import('nodemailer');
    const port = Number(env.SMTP_PORT) || 587;
    transport = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port,
      secure: env.SMTP_SECURE ? env.SMTP_SECURE === 'true' : port === 465,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    });
  }
  return transport;
}

export const isWeekKey = k => /^\d{4}-\d{2}-\d{2}$/.test(k || '') && new Date(fromKey(k)).getDay() === 1;
export const isEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e || '');

export function weekShifts(data, staffId, weekStart) {
  const end = dkey(addDays(fromKey(weekStart), 6));
  return data.shifts
    .filter(x => x.staffId === staffId && x.date >= weekStart && x.date <= end)
    .sort((a, b) => a.date.localeCompare(b.date) || toMin(a.start) - toMin(b.start));
}

// Identifies exactly what was sent, so the UI can flag rosters changed since.
export const fingerprint = list => list.map(x => `${x.date} ${x.start}-${x.end} ${x.area}`).join('|');

const esc = v => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function rosterEmail(person, list, weekStart, lang) {
  setLang(LANGS[lang] ? lang : 'en');
  const range = rangeLabel(fromKey(weekStart));
  const first = person.name.split(' ')[0];
  const hours = list.reduce((a, x) => a + shiftH(x), 0);
  const rows = list.map(x => ({ day: dlabel(fromKey(x.date)), time: `${x.start}–${x.end}`, area: tv('area', x.area) }));
  const total = t('mail.total', { n: list.length, h: +hours.toFixed(2) });

  const subject = t('mail.subject', { range });
  const text = [
    t('mail.greeting', { name: first }), '',
    t('mail.intro', { range }), '',
    ...rows.map(r => `  ${r.day.padEnd(12)} ${r.time}  ${r.area}`), '',
    total, '',
    t('mail.footer'),
  ].join('\n');
  const cell = 'padding:8px 12px;border-bottom:1px solid #ECE8DE;';
  const html = `<div style="font-family:Inter,Arial,sans-serif;color:#16150F;max-width:520px">
  <p>${esc(t('mail.greeting', { name: first }))}</p>
  <p>${esc(t('mail.intro', { range }))}</p>
  <table style="border-collapse:collapse;width:100%;font-size:14px">
    <tr style="text-align:left;color:#6B675C;font-size:12px">
      <th style="${cell}">${esc(t('mail.colDay'))}</th><th style="${cell}">${esc(t('mail.colTime'))}</th><th style="${cell}">${esc(t('mail.colArea'))}</th>
    </tr>
    ${rows.map(r => `<tr><td style="${cell}">${esc(r.day)}</td><td style="${cell}font-family:monospace">${esc(r.time)}</td><td style="${cell}">${esc(r.area)}</td></tr>`).join('\n    ')}
  </table>
  <p style="font-weight:600">${esc(total)}</p>
  <p style="color:#6B675C">${esc(t('mail.footer'))}</p>
</div>`;
  return { subject, text, html };
}

export async function sendEmail({ to, subject, text, html }) {
  const cfg = emailConfig();
  if (!cfg.configured) {
    console.log(`\n── Email preview (SMTP not configured) ──\nTo: ${to}\nSubject: ${subject}\n\n${text}\n`);
    return 'preview';
  }
  await (await getTransport()).sendMail({ from: cfg.from, to, subject, text, html });
  return 'sent';
}
