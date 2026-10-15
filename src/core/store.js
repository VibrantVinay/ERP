import { modules } from '../data/modules.js';

const STORAGE_KEY = 'gelato-house-erp-v2';
let records = readBrowserData();
let apiOnline = false;
let serverRevision = -1;
let auditEntries = [];

function starterRecords() {
  return Object.fromEntries(Object.entries(modules).map(([key, module]) => [key, module.records.map((cells, index) => ({ id: `${key}-${index + 1}`, cells: [...cells], createdAt: '', updatedAt: '' }))]));
}

function readBrowserData() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (value && typeof value === 'object' && Object.keys(modules).every(key => Array.isArray(value[key]))) return value;
  } catch { /* Use the built in sample records if storage is unavailable. */ }
  return starterRecords();
}

function persistBrowserData() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(records)); } catch { /* Keep the current session usable when storage is full or disabled. */ } }

async function request(path, options = {}) {
  const response = await fetch(path, { ...options, headers: { 'Content-Type': 'application/json', ...options.headers } });
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
  persistBrowserData();
  if (changed && announce) window.dispatchEvent(new CustomEvent('hotel-data-updated'));
  if (wasOffline && announce) window.dispatchEvent(new CustomEvent('hotel-connectivity-updated'));
  return changed;
}

async function bootstrap() {
  try { await loadSnapshot(); }
  catch { apiOnline = false; persistBrowserData(); }
}

export const store = {
  ready: bootstrap(),
  list(key) { return [...(records[key] || [])]; },
  audit() { return [...auditEntries]; },
  exportBackup() { return { application:'Gelato House Hotel ERP', version:1, exportedAt:new Date().toISOString(), dataMode:apiOnline?'shared-local-server':'browser-local-fallback', records, audit:auditEntries }; },
  connected() { return apiOnline; },
  async refresh() {
    try { return await loadSnapshot({ announce: true }); }
    catch { const wasOnline = apiOnline; apiOnline = false; if (wasOnline) window.dispatchEvent(new CustomEvent('hotel-connectivity-updated')); return false; }
  },
  async create(key, cells) {
    if (apiOnline) {
      const result = await request(`/api/modules/${encodeURIComponent(key)}/records`, { method: 'POST', body: JSON.stringify({ cells }) });
      records[key] = [result.item, ...(records[key] || [])];
      auditEntries = (await request('/api/audit?limit=100')).items;
      return result.item;
    }
    const item = { id: `${key}-${crypto.randomUUID()}`, cells, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    records[key] = [item, ...(records[key] || [])]; persistBrowserData(); return item;
  },
  async update(key, id, cells) {
    if (apiOnline) {
      const result = await request(`/api/modules/${encodeURIComponent(key)}/records/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify({ cells }) });
      records[key] = (records[key] || []).map(item => item.id === id ? result.item : item);
      auditEntries = (await request('/api/audit?limit=100')).items;
      return result.item;
    }
    records[key] = (records[key] || []).map(item => item.id === id ? { ...item, cells, updatedAt: new Date().toISOString() } : item); persistBrowserData();
  },
  async advanceReservation(id, status) {
    if (apiOnline) {
      const result = await request(`/api/modules/reservations/records/${encodeURIComponent(id)}/advance`, { method:'POST', body:JSON.stringify({ status }) });
      await loadSnapshot();
      return result.item;
    }
    const booking = (records.reservations || []).find(item => item.id === id);
    if (!booking) return;
    const updated = { ...booking, cells:[...booking.cells], updatedAt:new Date().toISOString() };
    updated.cells[6] = status;
    records.reservations = records.reservations.map(item => item.id === id ? updated : item);
    const roomNumber = String(updated.cells[2]).split(' · ')[0].trim();
    const room = (records.rooms || []).find(item => String(item.cells[0]) === roomNumber);
    if (room && status === 'Checked in') { room.cells[3] = updated.cells[0]; room.cells[5] = 'Occupied'; }
    if (room && status === 'Checked out') { room.cells[3] = '—'; room.cells[5] = 'Cleaning'; }
    if (status === 'Checked in') {
      const desk = (records.frontDesk || []).find(item => item.cells[0] === updated.cells[0] && item.cells[1] === roomNumber && item.cells[5] !== 'Checked out');
      if (desk) desk.cells[5] = 'Checked in';
      else records.frontDesk.unshift({ id:`desk-${crypto.randomUUID()}`, cells:[updated.cells[0],roomNumber,`${updated.cells[1]} · stay`,updated.cells[3],'0','Checked in'] });
    }
    if (status === 'Cancelled' && room && /reserved/i.test(room.cells[5] || '') && room.cells[3] === updated.cells[0]) { room.cells[3] = '—'; room.cells[5] = 'Available'; }
    if (status === 'Checked out') {
      const desk = (records.frontDesk || []).find(item => item.cells[0] === updated.cells[0] && item.cells[1] === roomNumber);
      if (desk) desk.cells[5] = 'Checked out';
      records.housekeeping.unshift({ id:`housekeeping-${crypto.randomUUID()}`, cells:[roomNumber,'Checkout clean','Housekeeping','Normal','','To clean'] });
    }
    persistBrowserData(); return updated;
  },
  async remove(key, id) {
    if (apiOnline) { await request(`/api/modules/${encodeURIComponent(key)}/records/${encodeURIComponent(id)}`, { method: 'DELETE' }); auditEntries = (await request('/api/audit?limit=100')).items; }
    records[key] = (records[key] || []).filter(item => item.id !== id); persistBrowserData();
  },
  async reset() {
    if (apiOnline) { await request('/api/demo/reset', { method: 'POST', body: '{}' }); await loadSnapshot(); }
    else { records = starterRecords(); persistBrowserData(); }
  }
};
