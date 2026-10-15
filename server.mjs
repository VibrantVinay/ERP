import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { advanceReservation, createRecord, dashboardSummary, deleteRecord, initializeDatabase, listRecords, readAudit, readSnapshot, resetDatabase, updateRecord } from './src/server/database.js';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 4173);
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml' };
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'same-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'"
};

function sendJson(response, status, payload) {
  response.writeHead(status, { ...securityHeaders, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  response.end(payload === undefined ? '' : JSON.stringify(payload));
}

async function readJson(request) {
  let size = 0; const chunks = [];
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 1_000_000) { const error = new Error('Request body exceeds 1 MB'); error.status = 413; throw error; }
    chunks.push(chunk);
  }
  if (!size) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { const error = new Error('Request body must be valid JSON'); error.status = 400; throw error; }
}

async function handleApi(request, response, url) {
  const parts = url.pathname.split('/').filter(Boolean);
  const method = request.method;
  if (url.pathname === '/api/health' && method === 'GET') return sendJson(response, 200, { status: 'ok', service: 'gelato-house-local-api', time: new Date().toISOString() });
  if (url.pathname === '/api/dashboard' && method === 'GET') return sendJson(response, 200, await dashboardSummary());
  if (url.pathname === '/api/snapshot' && method === 'GET') return sendJson(response, 200, await readSnapshot());
  if (url.pathname === '/api/audit' && method === 'GET') {
    const limit = Math.min(200, Math.max(1, Number(url.searchParams.get('limit') || 50)));
    return sendJson(response, 200, { items: await readAudit(limit) });
  }
  if (url.pathname === '/api/demo/reset' && method === 'POST') {
    await resetDatabase(); return sendJson(response, 200, { ok: true });
  }
  if (parts[1] === 'modules' && parts[2] === 'reservations' && parts[3] === 'records' && parts[4] && parts[5] === 'advance' && parts.length === 6 && method === 'POST') {
    return sendJson(response, 200, { item: await advanceReservation(parts[4], (await readJson(request)).status) });
  }
  if (parts[1] === 'modules' && parts[3] === 'records' && parts.length === 4 && method === 'GET') {
    return sendJson(response, 200, { items: await listRecords(parts[2]) });
  }
  if (parts[1] === 'modules' && parts[3] === 'records' && parts.length === 4 && method === 'POST') {
    return sendJson(response, 201, { item: await createRecord(parts[2], await readJson(request)) });
  }
  if (parts[1] === 'modules' && parts[3] === 'records' && parts[4] && parts.length === 5 && method === 'PUT') {
    return sendJson(response, 200, { item: await updateRecord(parts[2], parts[4], await readJson(request)) });
  }
  if (parts[1] === 'modules' && parts[3] === 'records' && parts[4] && parts.length === 5 && method === 'DELETE') {
    await deleteRecord(parts[2], parts[4]); return sendJson(response, 204);
  }
  sendJson(response, 404, { error: 'API route not found' });
}

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host || '127.0.0.1'}`);
    if (url.pathname.startsWith('/api/')) {
      await handleApi(request, response, url);
      return;
    }
    if (!['GET','HEAD'].includes(request.method)) { sendJson(response, 405, { error: 'Method not allowed' }); return; }
    const pathname = decodeURIComponent(url.pathname);
    let file = path.resolve(root, `.${pathname}`);
    const relative = path.relative(root, file);
    if (relative.startsWith('..') || path.isAbsolute(relative)) { response.writeHead(400, securityHeaders); response.end('Invalid path'); return; }
    try { if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html'); }
    catch { file = path.join(root, 'index.html'); }
    const body = await readFile(file);
    response.writeHead(200, { ...securityHeaders, 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch (error) {
    const status = error.status || (error.code === 'ENOENT' ? 404 : 500);
    if (request.url?.startsWith('/api/')) sendJson(response, status, { error: status === 500 ? 'Unexpected server error' : error.message });
    else { response.writeHead(status, { ...securityHeaders, 'Content-Type': 'text/plain; charset=utf-8' }); response.end(status === 500 ? 'Server error' : error.message); }
    if (status === 500) console.error(error);
  }
});

await initializeDatabase();
server.listen(port, '127.0.0.1', () => console.log(`Gelato House is ready at http://127.0.0.1:${port}`));
