import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { modules } from '../data/modules.js';
import { todayISO } from '../core/dates.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../');
const dataDirectory = path.join(root, 'storage');
const databaseFile = path.join(dataDirectory, 'hotel-data.json');
let database;
let mutationQueue = Promise.resolve();

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
  await mkdir(dataDirectory, { recursive: true });
  const temporary = `${databaseFile}.${randomUUID()}.tmp`;
  await writeFile(temporary, JSON.stringify(database, null, 2), 'utf8');
  await rename(temporary, databaseFile);
}

export async function initializeDatabase() {
  await mkdir(dataDirectory, { recursive: true });
  try {
    database = JSON.parse(await readFile(databaseFile, 'utf8'));
    if (database.version !== 1 || !database.records || !database.audit) throw new Error('Unsupported hotel data file version');
    if (!Number.isInteger(database.revision)) database.revision = 0;
    for (const [key, module] of Object.entries(modules)) if (!Array.isArray(database.records[key])) database.records[key] = module.records.map(cells => ({ id: randomUUID(), cells: [...cells], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    database = starterData();
    await flush();
  }
}

function assertKey(key) {
  if (!Object.hasOwn(modules, key)) { const error = new Error('Unknown hotel module'); error.status = 404; throw error; }
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

function ensureRoomAvailable(cells, excludeId = '') {
  const [guest, confirmation, room, arrival, departure] = cells;
  if (departure <= arrival) { const error = new Error('Departure must be after arrival'); error.status = 400; throw error; }
  const roomNumber = room.split(' · ')[0].trim();
  const collision = (database.records.reservations || []).find(record => {
    if (record.id === excludeId || /cancelled|checked out/i.test(record.cells[6] || '')) return false;
    const existingRoom = String(record.cells[2] || '').split(' · ')[0].trim();
    return existingRoom === roomNumber && arrival < record.cells[4] && departure > record.cells[3];
  });
  if (collision) { const error = new Error(`Room ${roomNumber} already has an overlapping reservation (${collision.cells[0]}, ${collision.cells[3]} to ${collision.cells[4]})`); error.status = 409; throw error; }
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
  if (key === 'reservations' && !cells[1]) cells[1] = `GH-${randomUUID().slice(0,6).toUpperCase()}`;
  return enqueue(() => {
    if (key === 'reservations') ensureRoomAvailable(cells);
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
    if (key === 'reservations') {
      if (cells[6] !== record.cells[6]) { const error = new Error('Use the reservation workflow action to change a stay status'); error.status = 409; throw error; }
      ensureRoomAvailable(cells, id);
    }
    record.cells = cells; record.updatedAt = new Date().toISOString(); addAudit('updated', key, id); return record;
  });
}

export function advanceReservation(id, targetStatus) {
  return enqueue(() => {
    const booking = (database.records.reservations || []).find(item => item.id === id);
    if (!booking) { const error = new Error('Reservation not found'); error.status = 404; throw error; }
    const flow = { Pending:['Confirmed','Cancelled'], Confirmed:['Checked in','Cancelled'], 'Checked in':['Checked out'] };
    const currentStatus = booking.cells[6];
    if (!flow[currentStatus]?.includes(targetStatus)) { const error = new Error(`Cannot move this stay from ${currentStatus} to ${targetStatus}`); error.status = 409; throw error; }
    const now = new Date().toISOString();
    const roomNumber = String(booking.cells[2] || '').split(' · ')[0].trim();
    const assignedRoom = (database.records.rooms || []).find(item => String(item.cells[0]) === roomNumber);
    if (targetStatus === 'Checked in' && !assignedRoom) { const error = new Error(`Room ${roomNumber} is not configured in the room board`); error.status = 409; throw error; }
    if (targetStatus === 'Checked in' && assignedRoom && (/out of order|cleaning/i.test(assignedRoom.cells[5] || '') || (/occupied/i.test(assignedRoom.cells[5] || '') && assignedRoom.cells[3] !== booking.cells[0]))) {
      const error = new Error(`Room ${roomNumber} is not ready for check-in`); error.status = 409; throw error;
    }
    booking.cells[6] = targetStatus; booking.updatedAt = now; addAudit(`status changed to ${targetStatus}`, 'reservations', booking.id);
    if (targetStatus === 'Cancelled') {
      const room = (database.records.rooms || []).find(item => String(item.cells[0]) === roomNumber);
      if (room && /reserved/i.test(room.cells[5] || '') && room.cells[3] === booking.cells[0]) { room.cells[3] = '—'; room.cells[5] = 'Available'; room.updatedAt = now; addAudit('cancelled booking released room', 'rooms', room.id); }
      return booking;
    }
    const room = assignedRoom;
    if (targetStatus === 'Checked in') {
      if (room) { room.cells[3] = booking.cells[0]; room.cells[5] = 'Occupied'; room.updatedAt = now; addAudit('guest checked in', 'rooms', room.id); }
      const existingDeskRecord = (database.records.frontDesk || []).find(item => item.cells[0] === booking.cells[0] && item.cells[1] === roomNumber && item.cells[5] !== 'Checked out');
      if (existingDeskRecord) {
        existingDeskRecord.cells[5] = 'Checked in'; existingDeskRecord.updatedAt = now; addAudit('check-in updated', 'frontDesk', existingDeskRecord.id);
      } else {
        const deskRecord = { id:randomUUID(), cells:[booking.cells[0],roomNumber,`${booking.cells[1]} · stay`,booking.cells[3],'0','Checked in'],createdAt:now,updatedAt:now };
        database.records.frontDesk.unshift(deskRecord); addAudit('check-in created', 'frontDesk', deskRecord.id);
      }
    }
    if (targetStatus === 'Checked out') {
      if (room) { room.cells[3] = '—'; room.cells[5] = 'Cleaning'; room.updatedAt = now; addAudit('room sent for cleaning', 'rooms', room.id); }
      const deskRecord = (database.records.frontDesk || []).find(item => item.cells[0] === booking.cells[0] && item.cells[1] === roomNumber && item.cells[5] !== 'Checked out');
      if (deskRecord) { deskRecord.cells[5] = 'Checked out'; deskRecord.updatedAt = now; addAudit('check-out completed', 'frontDesk', deskRecord.id); }
      const taskCells = [roomNumber,'Checkout clean','Housekeeping','Normal','', 'To clean'];
      const task = { id:randomUUID(), cells:taskCells, createdAt:now, updatedAt:now };
      database.records.housekeeping.unshift(task); addAudit('checkout clean assigned', 'housekeeping', task.id);
    }
    return booking;
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
  const rooms = database.records.rooms || [];
  const occupied = rooms.filter(room => /occupied|reserved/i.test(room.cells[5] || '')).length;
  const arrivals = (database.records.reservations || []).filter(record => record.cells[3] === todayISO('Asia/Kolkata')).length;
  const tasksOpen = (database.records.housekeeping || []).filter(record => !/ready/i.test(record.cells[5] || '')).length;
  return { generatedAt: new Date().toISOString(), counts, sampleBoard: { roomsTracked: rooms.length, occupiedRoomsTracked: occupied, arrivalsTrackedToday: arrivals, openHousekeepingTasksTracked: tasksOpen }, property: { name: 'The Gelato Grand', city: 'Goa, India', timezone: 'Asia/Kolkata', currency: 'INR' } };
}
