import { modules } from '../data/restaurant-modules.js';

let records = starterRecords();
let apiOnline = false;
let serverRevision = -1;
let auditEntries = [];

function starterRecords() {
  return Object.fromEntries(Object.entries(modules).map(([key, module]) => [key, module.records.map((cells, index) => ({ id: `${key}-${index + 1}`, cells: [...cells], createdAt: '', updatedAt: '' }))]));
}

async function request(path, options = {}) {
  const response = await fetch(path, { credentials: 'same-origin', ...options, headers: { 'Content-Type': 'application/json', ...options.headers } });
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.error || `Request failed (${response.status})`);
  }
  return response.status === 204 ? null : response.json();
}

async function loadSnapshot({ announce = false } = {}) {
  const snapshot = await request('/api/snapshot');
  const changed = serverRevision >= 0 && snapshot.revision !== serverRevision;
  const wasOffline = !apiOnline;
  serverRevision = snapshot.revision;
  records = snapshot.records;
  auditEntries = (await request('/api/audit?limit=100')).items;
  apiOnline = true;
  if (changed && announce) window.dispatchEvent(new CustomEvent('restaurant-data-updated'));
  if (wasOffline && announce) window.dispatchEvent(new CustomEvent('restaurant-connectivity-updated'));
  return changed;
}

async function bootstrap() {
  try { await loadSnapshot(); }
  catch { apiOnline = false; }
}

export const store = {
  ready: bootstrap(),
  list(key) { return [...(records[key] || [])]; },
  audit() { return [...auditEntries]; },
  exportBackup() { return { application:'Rift Restaurant ERP', version:1, exportedAt:new Date().toISOString(), dataMode:apiOnline?'supabase':'browser-local-fallback', records, audit:auditEntries }; },
  connected() { return apiOnline; },
  async refresh() {
    try { await request('/api/auth/session'); return await loadSnapshot({ announce: true }); }
    catch { const wasOnline = apiOnline; apiOnline = false; if (wasOnline) window.dispatchEvent(new CustomEvent('restaurant-connectivity-updated')); return false; }
  },
  async create(key, cells) {
    if (!apiOnline) throw new Error('Database connection is unavailable. This change was not saved.');
    const result = await request(`/api/modules/${encodeURIComponent(key)}/records`, { method: 'POST', body: JSON.stringify({ cells }) });
    records[key] = [result.item, ...(records[key] || [])];
    auditEntries = (await request('/api/audit?limit=100')).items;
    return result.item;
  },
  async update(key, id, cells) {
    if (!apiOnline) throw new Error('Database connection is unavailable. This change was not saved.');
    const result = await request(`/api/modules/${encodeURIComponent(key)}/records/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify({ cells }) });
    records[key] = (records[key] || []).map(item => item.id === id ? result.item : item);
    auditEntries = (await request('/api/audit?limit=100')).items;
    return result.item;
  },
  async remove(key, id) {
    if (!apiOnline) throw new Error('Database connection is unavailable. This change was not saved.');
    await request(`/api/modules/${encodeURIComponent(key)}/records/${encodeURIComponent(id)}`, { method: 'DELETE' });
    auditEntries = (await request('/api/audit?limit=100')).items;
    records[key] = (records[key] || []).filter(item => item.id !== id);
  },
  async reset() {
    if (!apiOnline) throw new Error('Database connection is unavailable. Demo data was not reset.');
    await request('/api/demo/reset', { method: 'POST', body: '{}' }); await loadSnapshot();
  }
};
