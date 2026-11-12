// Local server: serves the app's static files and the JSON API (handler.js).
// On Vercel, the static files are served by the CDN and the API by api/index.js.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleApi } from './handler.js';

const root = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.env.PORT) || 5173;
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};
// Only the browser app is public; server code is not.
const publicPath = p => p === '/index.html' || p.startsWith('/css/') || p.startsWith('/js/');

http.createServer(async (req, res) => {
  let path;
  try { path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); } catch { return res.writeHead(400).end('Bad request'); }
  if (path.startsWith('/api/')) return handleApi(req, res);
  if (path.endsWith('/')) path += 'index.html';
  const file = normalize(join(root, path));
  if (!publicPath('/' + relative(root, file).split(sep).join('/'))) return res.writeHead(404).end('Not found');
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end('Not found');
  }
}).listen(port, () => console.log(`Punchcard running at http://localhost:${port}`));
