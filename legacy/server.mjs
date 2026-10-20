import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleSupabaseApi } from './src/server/supabase-api.js';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 4173);
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml' };
const securityHeaders = { 'X-Content-Type-Options':'nosniff', 'X-Frame-Options':'DENY', 'Referrer-Policy':'same-origin', 'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'" };

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host || '127.0.0.1'}`);
    if (url.pathname.startsWith('/api/')) return await handleSupabaseApi(request, response);
    if (!['GET','HEAD'].includes(request.method)) { response.writeHead(405, securityHeaders); response.end('Method not allowed'); return; }
    let file = path.resolve(root, `.${decodeURIComponent(url.pathname)}`);
    const relative = path.relative(root, file);
    if (relative.startsWith('..') || path.isAbsolute(relative)) { response.writeHead(400, securityHeaders); response.end('Invalid path'); return; }
    try { if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html'); }
    catch { file = path.join(root, 'index.html'); }
    const body = await readFile(file);
    response.writeHead(200, { ...securityHeaders, 'Content-Type':mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control':'no-store' });
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch (error) {
    const status = error.code === 'ENOENT' ? 404 : 500;
    response.writeHead(status, { ...securityHeaders, 'Content-Type':'text/plain; charset=utf-8' });
    response.end(status === 500 ? 'Server error' : 'Not found');
    if (status === 500) console.error(error);
  }
});

server.listen(port, '127.0.0.1', () => console.log(`Rift is ready at http://127.0.0.1:${port}`));
