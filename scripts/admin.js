// Create an admin account, or reset an existing admin's password.
// Usage: npm run admin   (uses the database at DATABASE_URL)
import { createInterface } from 'node:readline';
import { openDb } from '../db.js';
import { hashPassword, isEmail, MIN_PASSWORD } from '../auth.js';

const db = openDb();

const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: !!process.stdin.isTTY });
// Hide typed characters while a password is being entered.
let muted = false;
rl._writeToOutput = s => { if (!muted) rl.output.write(s); };
const lines = rl[Symbol.asyncIterator](); // buffers input, so piped answers aren't lost
async function ask(question, hidden = false) {
  process.stdout.write(question);
  muted = hidden;
  const { value = '' } = await lines.next();
  muted = false;
  if (hidden || !process.stdin.isTTY) process.stdout.write('\n');
  return value.trim();
}

try {
  const email = (await ask('Admin email: ')).toLowerCase();
  if (!isEmail(email)) throw new Error('That is not a valid email address.');
  const existing = await db.admins.byEmail(email);
  const name = existing ? existing.name : await ask('Name (optional): ');
  const password = await ask(existing ? 'New password: ' : 'Password: ', true);
  if (password.length < MIN_PASSWORD) throw new Error(`The password must be at least ${MIN_PASSWORD} characters.`);
  if (await ask('Repeat password: ', true) !== password) throw new Error('The passwords do not match.');
  if (existing) {
    await db.admins.setPassword(existing.id, hashPassword(password));
    console.log(`Password updated for ${email}. Existing sessions were signed out.`);
  } else {
    await db.admins.create(email, name, hashPassword(password));
    console.log(`Admin account created for ${email}.`);
  }
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
} finally {
  rl.close();
  await db.close();
}
