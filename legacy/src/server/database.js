import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { modules } from '../data/restaurant-modules.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../');
const dataDirectory = path.join(root, 'storage');
const databaseFile = path.join(dataDirectory, 'restaurant-data.json');
let database;
let mutationQueue = Promise.resolve();
let persistenceAvailable = true;

function starterData() {
  return {
    version: 1,
    revision: 0,
    createdAt: new Date().toISOString(),
    records: Object.fromEntries(Object.entries(modules).map(([key, module]) => [key, module.records.map(cells => ({ id: randomUUID(), cells: [...cells], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }))])),
    audit: []
  };
}

async function flush() {
  if (!persistenceAvailable) return;
  try {
    await mkdir(dataDirectory, { recursive: true });
    const temporary = `${databaseFile}.${randomUUID()}.tmp`;
    await writeFile(temporary, JSON.stringify(database, null, 2), 'utf8');
    await rename(temporary, databaseFile);
  } catch (error) {
    if (error.code !== 'EPERM' && error.code !== 'EACCES') throw error;
    persistenceAvailable = false;
    console.warn('Restaurant data is running in memory because the current environment blocked local file writes.');
  }
}

export async function initializeDatabase() {
  try { await mkdir(dataDirectory, { recursive: true }); }
  catch (error) { if (error.code !== 'EPERM' && error.code !== 'EACCES') throw error; persistenceAvailable = false; }
  try {
    database = JSON.parse(await readFile(databaseFile, 'utf8'));
    if (database.version !== 1 || !database.records || !database.audit) throw new Error('Unsupported restaurant data file version');
    if (!Number.isInteger(database.revision)) database.revision = 0;
    for (const [key, module] of Object.entries(modules)) if (!Array.isArray(database.records[key])) database.records[key] = module.records.map(cells => ({ id: randomUUID(), cells: [...cells], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    database = starterData();
    await flush();
  }
}

function assertKey(key) {
  if (!Object.hasOwn(modules, key)) { const error = new Error('Unknown restaurant module'); error.status = 404; throw error; }
}

function validateCells(key, cells) {
  assertKey(key);
  const schema = modules[key].fields;
  if (!Array.isArray(cells) || cells.length !== schema.length) { const error = new Error(`Expected ${schema.length} fields for ${modules[key].title}`); error.status = 400; throw error; }
  return cells.map((value, index) => {
    const [field, label, type, required, options] = schema[index];
    const text = String(value ?? '').trim();
    if (required && !text) { const error = new Error(`${label} is required`); error.status = 400; throw error; }
    if (text.length > 500) { const error = new Error(`${label} is too long`); error.status = 400; throw error; }
    if (type === 'number' && text && (!Number.isFinite(Number(text)) || Number(text) < 0)) { const error = new Error(`${label} must be a non-negative number`); error.status = 400; throw error; }
    if (type === 'date' && text && !/^\d{4}-\d{2}-\d{2}$/.test(text)) { const error = new Error(`${label} must use YYYY-MM-DD`); error.status = 400; throw error; }
    if (type === 'select' && options?.length && text && !options.includes(text)) { const error = new Error(`${label} has an unsupported value`); error.status = 400; throw error; }
    return text;
  });
}

function addAudit(action, moduleKey, recordId) {
  database.audit.unshift({ id: randomUUID(), action, module: moduleKey, recordId, at: new Date().toISOString(), actor: 'Local property manager' });
  database.audit.length = Math.min(database.audit.length, 500);
}

function enqueue(operation) {
  const next = mutationQueue.then(async () => {
    const result = await operation();
    database.revision++;
    await flush();
    return result;
  });
  mutationQueue = next.catch(() => {});
  return next;
}

export async function listRecords(key) { assertKey(key); await mutationQueue; return database.records[key]; }

export function createRecord(key, input) {
  const cells = validateCells(key, input?.cells);
  return enqueue(() => {
    const now = new Date().toISOString();
    const record = { id: randomUUID(), cells, createdAt: now, updatedAt: now };
    database.records[key].unshift(record); addAudit('created', key, record.id); return record;
  });
}

export function updateRecord(key, id, input) {
  const cells = validateCells(key, input?.cells);
  return enqueue(() => {
    const record = database.records[key].find(item => item.id === id);
    if (!record) { const error = new Error('Record not found'); error.status = 404; throw error; }
    record.cells = cells; record.updatedAt = new Date().toISOString(); addAudit('updated', key, id); return record;
  });
}

export function deleteRecord(key, id) {
  assertKey(key);
  return enqueue(() => {
    const existing = database.records[key].find(item => item.id === id);
    if (!existing) { const error = new Error('Record not found'); error.status = 404; throw error; }
    database.records[key] = database.records[key].filter(item => item.id !== id); addAudit('deleted', key, id); return { id };
  });
}

export function resetDatabase() {
  return enqueue(() => { database = starterData(); addAudit('restored demo data', 'all', null); return { reset: true }; });
}

export async function readAudit(limit = 50) { await mutationQueue; return database.audit.slice(0, limit); }

export async function readSnapshot() { await mutationQueue; return { revision: database.revision, records: database.records }; }

export async function dashboardSummary() {
  await mutationQueue;
  const counts = Object.fromEntries(Object.entries(database.records).map(([key, records]) => [key, records.length]));
  const orders = database.records.orders || [];
  const tables = database.records.tables || [];
  const stock = database.records.inventory || [];
  const salesToday = orders.reduce((sum, order) => sum + Number(order.cells[4] || 0), 0);
  const alerts = stock.filter(item => /low|expiring|out of stock/i.test(item.cells[6] || '')).length;
  return { generatedAt: new Date().toISOString(), counts, sampleBoard: { activeTickets: orders.filter(order => !/completed|cancelled/i.test(order.cells[6] || '')).length, tablesInService: tables.filter(table => /seated|ordering|dining/i.test(table.cells[5] || '')).length, ingredientAlerts: alerts, salesToday }, property: { name: 'Rift', city: 'Panaji, Goa', timezone: 'Asia/Kolkata', currency: 'INR' } };
}
