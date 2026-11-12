// Copies the browser app into public/, the only folder Vercel serves as static
// files, so server code (db.js, handler.js, ...) is never published.
import { cpSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const out = root + 'public/';
rmSync(out, { recursive: true, force: true });
for (const p of ['index.html', 'css', 'js']) cpSync(root + p, out + p, { recursive: true });
console.log('Static files copied to public/');
