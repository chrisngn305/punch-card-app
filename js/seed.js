import { dkey, sod, addDays, weekStart, toMin, at, uid, areaForRole, MINUTE } from './utils.js';

// Test inbox for the demo staff. Gmail delivers "name+tag@gmail.com" to the same
// inbox, so each person's roster email arrives tagged with their first name.
const TEST_INBOX = 'vanhuu3005@gmail.com';
const tag = name => name.split(' ')[0].normalize('NFD').replace(/[^a-zA-Z]/g, '').toLowerCase();
export const testEmail = name => {
  const [user, domain] = TEST_INBOX.split('@');
  return `${user}+${tag(name)}@${domain}`;
};
// For the browser demo, which never sends email: placeholder addresses only.
export const exampleEmail = name => `${tag(name)}@example.com`;

// Demo data: 8 staff, a three-week roster around today, and clock entries
// for every rostered shift that has already started.
export function seed(emailFor = testEmail) {
  const staff = [
    ['Maya Chen', 'Shift Lead', '1234', 24],
    ['Tomás Rivera', 'Barista', '2580', 18.5],
    ['Aisha Bello', 'Kitchen', '1111', 19],
    ['Liam O’Connor', 'Kitchen', '4321', 19],
    ['Priya Nair', 'Front of House', '7777', 17.5],
    ['Jonas Weber', 'Barista', '3690', 18.5],
    ['Sofia Rossi', 'Front of House', '1357', 17.5],
    ['Daniel Kim', 'Manager', '8642', 28],
  ].map((a, i) => ({
    id: 's' + (i + 1), name: a[0], role: a[1], pin: a[2], rate: a[3], active: true, tone: i,
    email: emailFor(a[0]),
    phone: '',
  }));

  const patterns = [['07:00', '15:00'], ['09:00', '17:00'], ['11:00', '19:00'], ['14:00', '22:00'], ['08:00', '14:00']];
  const now = Date.now(), ws = weekStart(now), today = sod(now);
  let r = 11;
  const rnd = () => { r = (r * 9301 + 49297) % 233280; return r / 233280; };
  const shifts = [], entries = [];

  for (let w = -1; w <= 1; w++) for (let d = 0; d < 7; d++) {
    const day = addDays(ws, w * 7 + d);
    staff.forEach((s, i) => {
      if (d === (i * 2) % 7 || d === (i * 2 + 3) % 7) return; // two days off a week
      const p = patterns[(i + d + 7) % patterns.length];
      shifts.push({ id: uid(), staffId: s.id, date: dkey(day), start: p[0], end: p[1], area: areaForRole(s.role) });

      const st = at(day, p[0]), en = at(day, p[1]);
      if (st > now || (day === today && i === 4)) return; // Priya is "late" today
      const inT = st + Math.round(rnd() * 14 - 6) * MINUTE;
      if (inT > now) return;
      const outT = en + Math.round(rnd() * 12 - 3) * MINUTE;
      const e = { id: uid(), staffId: s.id, in: inT, out: outT < now ? outT : null, breaks: [] };
      if (toMin(p[1]) - toMin(p[0]) >= 360) {
        const bs = inT + (240 + Math.round(rnd() * 30)) * MINUTE;
        if (bs < now) {
          const be = bs + 30 * MINUTE;
          e.breaks.push({ start: bs, end: (be < now || e.out) ? be : null });
        }
      }
      entries.push(e);
    });
  }
  return { staff, entries, shifts };
}
