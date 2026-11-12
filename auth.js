// Admin authentication: scrypt password hashes, cookie sessions, and a rate
// limiter for login and kiosk PIN attempts.
import { scryptSync, randomBytes, timingSafeEqual, createHash } from 'node:crypto';

const COOKIE = 'pc_session';
export const SESSION_MS = 7 * 24 * 3600 * 1000;
export const MIN_PASSWORD = 8;

export function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`;
}

export function verifyPassword(password, stored) {
  const [kind, salt, hash] = String(stored).split('$');
  if (kind !== 'scrypt' || !salt || !hash) return false;
  const expected = Buffer.from(hash, 'base64');
  const actual = scryptSync(String(password), Buffer.from(salt, 'base64'), expected.length);
  return timingSafeEqual(actual, expected);
}

// Used when the email doesn't exist, so a login takes the same time either way.
const DUMMY = hashPassword(randomBytes(12).toString('hex'));
export const burnPasswordCheck = password => verifyPassword(password, DUMMY);

export const newToken = () => randomBytes(32).toString('base64url');
export const hashToken = token => createHash('sha256').update(token).digest('hex');

export function readSessionToken(req) {
  const m = (req.headers.cookie || '').match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`));
  return m ? m[1] : null;
}

// HttpOnly so page scripts can't read it; SameSite=Strict so other sites can't use it.
export const sessionCookie = (token, secure) =>
  `${COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_MS / 1000}${secure ? '; Secure' : ''}`;
export const clearCookie = () => `${COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`;

export { isEmail } from './js/utils.js';

// Allows `max` failures per `windowMs` for each key (e.g. client IP), then blocks
// until the window passes. A success clears the key. Counts live in the database
// (db.limits) so every server instance sees the same numbers.
export function rateLimiter(store, name, max, windowMs) {
  const k = key => `${name}:${key}`;
  return {
    async retryAfter(key) {
      const h = await store.get(k(key));
      if (!h || Date.now() - h.first_at > windowMs) return 0;
      return h.count >= max ? Math.ceil((h.first_at + windowMs - Date.now()) / 1000) : 0;
    },
    fail: key => store.fail(k(key), windowMs),
    reset: key => store.reset(k(key)),
  };
}
