import { modules } from '../data/restaurant-modules.js';

const headers = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'same-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
  'Cache-Control': 'no-store'
};

function send(res, status, payload, extra = {}) {
  res.writeHead(status, { ...headers, ...extra, 'Content-Type': 'application/json; charset=utf-8' });
  res.end(payload === undefined ? '' : JSON.stringify(payload));
}

function cookies(req) {
  return Object.fromEntries(String(req.headers.cookie || '').split(';').map(part => part.trim()).filter(Boolean).map(part => {
    const index = part.indexOf('=');
    return [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
  }));
}

function setSessionCookies(req, tokens) {
  const secure = process.env.NODE_ENV === 'production' || req.headers['x-forwarded-proto'] === 'https';
  const common = `; Path=/; HttpOnly; SameSite=Strict${secure ? '; Secure' : ''}`;
  const maxAge = Math.max(60, Number(tokens.expires_in) || 3600);
  return [
    `rift_access=${encodeURIComponent(tokens.access_token)}${common}; Max-Age=${maxAge}`,
    `rift_refresh=${encodeURIComponent(tokens.refresh_token)}${common}; Max-Age=2592000`
  ];
}

function clearSessionCookies(req) {
  const secure = process.env.NODE_ENV === 'production' || req.headers['x-forwarded-proto'] === 'https';
  const common = `; Path=/; HttpOnly; SameSite=Strict${secure ? '; Secure' : ''}; Max-Age=0`;
  return [`rift_access=${common}`, `rift_refresh=${common}`];
}

function config() {
  const url = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const key = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || '';
  if (!url || !key) { const error = new Error('Supabase is not configured. Add SUPABASE_URL and SUPABASE_ANON_KEY to the environment.'); error.status = 503; throw error; }
  return { url, key };
}

async function supabase(path, accessToken, options = {}) {
  const { url, key } = config();
  const response = await fetch(`${url}${path}`, {
    method: options.method || 'GET',
    headers: { apikey: key, ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}), 'Content-Type': 'application/json', ...(options.prefer ? { Prefer: options.prefer } : {}) },
    ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) })
  });
  const body = await response.text();
  let data;
  try { data = body ? JSON.parse(body) : null; } catch { data = { message: body }; }
  if (!response.ok) { const error = new Error(data?.message || data?.msg || data?.error_description || 'Supabase request failed'); error.status = response.status === 401 ? 401 : response.status >= 500 ? 502 : response.status; throw error; }
  return data;
}

async function readBody(req) {
  // Use Vercel's pre-parsed body if available
  if (req.body) {
    return typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  }
  
  // Fallback for local Node.js development
  let size = 0; const chunks = [];
  for await (const chunk of req) { 
    size += chunk.length; 
    if (size > 1_000_000) { 
      const error = new Error('Request body exceeds 1 MB'); error.status = 413; throw error; 
    } 
    chunks.push(chunk); 
  }
  if (!size) return {};
  try { 
    return JSON.parse(Buffer.concat(chunks).toString('utf8')); 
  } catch { 
    const error = new Error('Request body must be valid JSON'); error.status = 400; throw error; 
  }
}

function validateCells(key, cells) {
  if (!Object.hasOwn(modules, key)) { const error = new Error('Unknown restaurant module'); error.status = 404; throw error; }
  const schema = modules[key].fields;
  if (!Array.isArray(cells) || cells.length !== schema.length) { const error = new Error(`Expected ${schema.length} fields for ${modules[key].title}`); error.status = 400; throw error; }
  return cells.map((value, index) => {
    const [field, label, type, required, options] = schema[index]; const text = String(value ?? '').trim();
    if (required && !text) { const error = new Error(`${label} is required`); error.status = 400; throw error; }
    if (text.length > 500) { const error = new Error(`${label} is too long`); error.status = 400; throw error; }
    if (type === 'number' && text && (!Number.isFinite(Number(text)) || Number(text) < 0)) { const error = new Error(`${label} must be a non-negative number`); error.status = 400; throw error; }
    if (type === 'date' && text && !/^\d{4}-\d{2}-\d{2}$/.test(text)) { const error = new Error(`${label} must use YYYY-MM-DD`); error.status = 400; throw error; }
    if (type === 'select' && options?.length && text && !options.includes(text)) { const error = new Error(`${label} has an unsupported value`); error.status = 400; throw error; }
    return text;
  });
}

async function userFor(req) {
  const token = cookies(req).rift_access;
  if (!token) { const error = new Error('Sign in to continue.'); error.status = 401; throw error; }
  try { return await supabase('/auth/v1/user', token); }
  catch { const error = new Error('Your session expired. Please sign in again.'); error.status = 401; throw error; }
}

async function restaurantId(user) {
    const id = await supabase('/rest/v1/rpc/get_or_create_restaurant', user.accessToken, { method: 'POST', body: {} });
  return typeof id === 'string' ? id : id?.restaurant_id;
}

async function rowsFor(tenantId, user) {
  return supabase(`/rest/v1/restaurant_records?select=id,module_key,cells,created_at,updated_at&restaurant_id=eq.${encodeURIComponent(tenantId)}&order=created_at.desc`, user.accessToken);
}

function groupRows(rows) {
  const records = Object.fromEntries(Object.keys(modules).map(key => [key, []]));
  for (const row of rows) if (records[row.module_key]) records[row.module_key].push({ id: row.id, cells: row.cells, createdAt: row.created_at, updatedAt: row.updated_at });
  return records;
}

async function seedIfEmpty(tenantId, user) {
  const existing = await supabase(`/rest/v1/restaurant_records?select=id&restaurant_id=eq.${encodeURIComponent(tenantId)}&limit=1`, user.accessToken);
  if (existing.length) return;
  const seed = Object.entries(modules).flatMap(([module_key, module]) => module.records.map(cells => ({ restaurant_id: tenantId, module_key, cells, created_by: user.id })));
  if (seed.length) await supabase('/rest/v1/restaurant_records', user.accessToken, { method: 'POST', body: seed, prefer: 'return=minimal' });
}

async function audit(tenantId, user, limit = 100) {
  const items = await supabase(`/rest/v1/restaurant_audit?select=id,action,module_key,record_id,actor,created_at&restaurant_id=eq.${encodeURIComponent(tenantId)}&order=created_at.desc&limit=${Math.min(200, Math.max(1, limit))}`, user.accessToken);
  return items.map(item => ({ id: item.id, action: item.action, module: item.module_key, recordId: item.record_id, actor: item.actor, at: item.created_at }));
}

async function addAudit(tenantId, user, action, moduleKey, recordId) {
  await supabase('/rest/v1/restaurant_audit', user.accessToken, { method: 'POST', body: { restaurant_id: tenantId, action, module_key: moduleKey, record_id: recordId || null, actor: user.email || 'Restaurant team', created_by: user.id }, prefer: 'return=minimal' });
}

async function refreshSession(req, res) {
  const refreshToken = cookies(req).rift_refresh;
  if (!refreshToken) return send(res, 401, { error: 'Sign in to continue.' });
  try {
    const tokens = await supabase('/auth/v1/token?grant_type=refresh_token', null, { method: 'POST', body: { refresh_token: refreshToken } });
    const user = await supabase('/auth/v1/user', tokens.access_token);
    return send(res, 200, { user: { id: user.id, email: user.email } }, { 'Set-Cookie': setSessionCookies(req, tokens) });
  } catch { return send(res, 401, { error: 'Your session expired. Please sign in again.' }, { 'Set-Cookie': clearSessionCookies(req) }); }
}

export async function handleSupabaseApi(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || '127.0.0.1'}`);
  const path = url.pathname;
  try {
    if (path === '/api/config' && req.method === 'GET') {
      try { config(); return send(res, 200, { configured: true }); } catch { return send(res, 200, { configured: false }); }
    }
    if (path === '/api/auth/login' && req.method === 'POST') {
      const { email, password } = await readBody(req);
      if (!email || !password) return send(res, 400, { error: 'Enter your email and password.' });
      const tokens = await supabase('/auth/v1/token?grant_type=password', null, { method: 'POST', body: { email: String(email).trim(), password } });
      const user = await supabase('/auth/v1/user', tokens.access_token);
      return send(res, 200, { user: { id: user.id, email: user.email } }, { 'Set-Cookie': setSessionCookies(req, tokens) });
    }
    if (path === '/api/auth/logout' && req.method === 'POST') return send(res, 200, { ok: true }, { 'Set-Cookie': clearSessionCookies(req) });
    if (path === '/api/auth/session' && req.method === 'GET') {
      const token = cookies(req).rift_access;
      if (!token) return refreshSession(req, res);
      try { const user = await supabase('/auth/v1/user', token); return send(res, 200, { user: { id: user.id, email: user.email } }); }
      catch { return refreshSession(req, res); }
    }
    if (path === '/api/health' && req.method === 'GET') return send(res, 200, { status: 'ok', service: 'rift-supabase-api', time: new Date().toISOString() });

    const authUser = await userFor(req);
    const user = { ...authUser, accessToken: cookies(req).rift_access };
    const tenantId = await restaurantId(user);

    if (path === '/api/snapshot' && req.method === 'GET') {
      await seedIfEmpty(tenantId, user);
      const rows = await rowsFor(tenantId, user);
      return send(res, 200, { revision: rows.reduce((max, row) => Math.max(max, Date.parse(row.updated_at) || 0), 0), records: groupRows(rows) });
    }
    if (path === '/api/audit' && req.method === 'GET') return send(res, 200, { items: await audit(tenantId, user, Number(url.searchParams.get('limit') || 100)) });
    if (path === '/api/dashboard' && req.method === 'GET') {
      const rows = await rowsFor(tenantId, user); const records = groupRows(rows); const orders = records.orders || []; const tables = records.tables || []; const stock = records.inventory || [];
      return send(res, 200, { generatedAt: new Date().toISOString(), counts: Object.fromEntries(Object.entries(records).map(([key, value]) => [key, value.length])), sampleBoard: { activeTickets: orders.filter(row => !/completed|cancelled/i.test(row.cells[6] || '')).length, tablesInService: tables.filter(row => /seated|ordering|dining/i.test(row.cells[5] || '')).length, ingredientAlerts: stock.filter(row => /low|expiring|out of stock/i.test(row.cells[6] || '')).length, salesToday: orders.reduce((sum, row) => sum + Number(row.cells[4] || 0), 0) }, property: { name: 'Rift', city: 'Panaji, Goa', timezone: 'Asia/Kolkata', currency: 'INR' } });
    }
    if (path === '/api/demo/reset' && req.method === 'POST') {
      await supabase(`/rest/v1/restaurant_records?restaurant_id=eq.${encodeURIComponent(tenantId)}`, user.accessToken, { method: 'DELETE', prefer: 'return=minimal' });
      await supabase(`/rest/v1/restaurant_audit?restaurant_id=eq.${encodeURIComponent(tenantId)}`, user.accessToken, { method: 'DELETE', prefer: 'return=minimal' });
      await supabase('/rest/v1/restaurant_audit', user.accessToken, { method: 'POST', body: { restaurant_id: tenantId, action: 'restored demo data', module_key: 'all', actor: user.email || 'Restaurant team', created_by: user.id }, prefer: 'return=minimal' });
      await seedIfEmpty(tenantId, user); return send(res, 200, { ok: true });
    }

    const parts = path.split('/').filter(Boolean);
    if (parts[1] === 'modules' && parts[3] === 'records') {
      const key = parts[2];
      if (!Object.hasOwn(modules, key)) return send(res, 404, { error: 'Unknown restaurant module' });
      if (parts.length === 4 && req.method === 'GET') {
        const rows = await supabase(`/rest/v1/restaurant_records?select=id,module_key,cells,created_at,updated_at&restaurant_id=eq.${encodeURIComponent(tenantId)}&module_key=eq.${encodeURIComponent(key)}&order=created_at.desc`, user.accessToken);
        return send(res, 200, { items: rows.map(row => ({ id: row.id, cells: row.cells, createdAt: row.created_at, updatedAt: row.updated_at })) });
      }
      if (parts.length === 4 && req.method === 'POST') {
        const cells = validateCells(key, (await readBody(req)).cells); const rows = await supabase('/rest/v1/restaurant_records', user.accessToken, { method: 'POST', body: { restaurant_id: tenantId, module_key: key, cells, created_by: user.id }, prefer: 'return=representation' });
        const row = rows[0]; await addAudit(tenantId, user, 'created', key, row.id); return send(res, 201, { item: { id: row.id, cells: row.cells, createdAt: row.created_at, updatedAt: row.updated_at } });
      }
      if (parts.length === 5 && parts[4] && req.method === 'PUT') {
        const cells = validateCells(key, (await readBody(req)).cells); const id = encodeURIComponent(parts[4]); const rows = await supabase(`/rest/v1/restaurant_records?id=eq.${id}&restaurant_id=eq.${encodeURIComponent(tenantId)}&module_key=eq.${encodeURIComponent(key)}`, user.accessToken, { method: 'PATCH', body: { cells }, prefer: 'return=representation' });
        if (!rows.length) return send(res, 404, { error: 'Record not found' });
        const row = rows[0]; await addAudit(tenantId, user, 'updated', key, row.id); return send(res, 200, { item: { id: row.id, cells: row.cells, createdAt: row.created_at, updatedAt: row.updated_at } });
      }
      if (parts.length === 5 && parts[4] && req.method === 'DELETE') {
        const id = encodeURIComponent(parts[4]); const found = await supabase(`/rest/v1/restaurant_records?id=eq.${id}&restaurant_id=eq.${encodeURIComponent(tenantId)}&module_key=eq.${encodeURIComponent(key)}&select=id`, user.accessToken);
        if (!found.length) return send(res, 404, { error: 'Record not found' });
        await supabase(`/rest/v1/restaurant_records?id=eq.${id}&restaurant_id=eq.${encodeURIComponent(tenantId)}&module_key=eq.${encodeURIComponent(key)}`, user.accessToken, { method: 'DELETE', prefer: 'return=minimal' });
        await addAudit(tenantId, user, 'deleted', key, id); res.writeHead(204, headers); return res.end();
      }
    }
    return send(res, 404, { error: 'API route not found' });
  } catch (error) {
    const status = error.status || 500;
    if (status >= 500) console.error('Rift API error:', error);
    return send(res, status, { error: status >= 500 ? 'Rift could not complete this request. Check the Supabase setup and server logs.' : error.message });
  }
}
