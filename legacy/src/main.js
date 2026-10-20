import { modules } from './data/modules.js';
import { currentRoute, navigate, listenRoute } from './core/router.js';
import { store } from './core/store.js';
import { renderLayout } from './components/layout.js';
import { modalMarkup } from './components/modal.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderAudit } from './pages/audit.js';
import { renderCalendar } from './pages/calendar.js';
import { nextStatus, renderModule, resolveWorkflowAction } from './pages/module.js';
import { displayToday } from './core/dates.js';

const app = document.querySelector('#app');
let activeModal = null;
let selectedWorkflow = '';
let calendarOffset = 0;

function render() {
  const { path, key } = currentRoute();
  const content = key === 'dashboard'
    ? renderDashboard()
    : key === 'audit' ? renderAudit() : key === 'calendar' ? renderCalendar(calendarOffset) : renderModule(key, modules[key]);
  app.innerHTML = renderLayout(path, content, store.connected());
  selectedWorkflow = '';
  document.title = `${key === 'dashboard' ? 'Dashboard' : key === 'audit' ? 'Audit history' : key === 'calendar' ? 'Reservation calendar' : modules[key].title} · Gelato House`;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toast(message) {
  const root = document.querySelector('#toast-root');
  const item = document.createElement('div');
  item.className = 'toast-message'; item.textContent = message; root.append(item);
  window.setTimeout(() => item.remove(), 3000);
}

function showModal(key, mode = 'create', id = '') {
  const config = modules[key];
  if (!config) return;
  const record = id ? store.list(key).find(item => item.id === id) : null;
  activeModal = { key, mode, id };
  const fields = key === 'reservations' && mode === 'edit' && record
    ? config.fields.map(field => field[0] === 'status' ? [field[0], 'Status (use stay actions to change)', 'select', false, [record.cells[6]]] : field)
    : config.fields;
  document.querySelector('#overlay-root').innerHTML = modalMarkup({ title: `${mode === 'edit' ? 'Edit' : 'New'} ${recordLabel(config)}`, fields, values: record?.cells || [], mode });
  document.querySelector('.modal-backdrop').classList.add('visible');
  document.querySelector('.modal input, .modal select')?.focus();
}

function recordLabel(config) {
  const title = config.title.toLowerCase();
  if (title.includes('reservation')) return 'reservation';
  if (title.includes('housekeeping')) return 'housekeeping task';
  if (title.includes('finance')) return 'transaction';
  if (title.includes('people')) return 'team member';
  if (title.includes('guest book')) return 'guest profile';
  if (title.includes('experience')) return 'guest request';
  if (title.includes('restaurant')) return 'restaurant order';
  if (title.includes('events')) return 'event';
  if (title.includes('maintenance')) return 'work order';
  if (title.includes('spa')) return 'appointment';
  if (title.includes('laundry')) return 'service request';
  if (title.includes('inventory')) return 'stock item';
  if (title.includes('procurement')) return 'purchase order';
  if (title.includes('booking')) return 'rate plan';
  if (title.includes('channel')) return 'channel';
  if (title.includes('front desk')) return 'guest movement';
  return 'record';
}

function closeModal() { activeModal = null; document.querySelector('#overlay-root').innerHTML = ''; }

async function advanceRecord(key, id, requestedStatus = '') {
  const config = modules[key];
  const item = store.list(key).find(record => record.id === id);
  const statusIndex = config?.fields.findIndex(field => field[0] === 'status') ?? -1;
  if (!item || statusIndex < 0) return;
  const next = requestedStatus || nextStatus(key, item.cells[statusIndex]);
  if (!next) return;
  const cells = [...item.cells]; cells[statusIndex] = next;
  try { if (key === 'reservations') await store.advanceReservation(id, next); else await store.update(key, id, cells); render(); toast(`${recordLabel(config)} moved to ${next}.`); }
  catch (error) { toast(error.message || 'Could not update this workflow.'); }
}

async function saveRecord(form) {
  if (!activeModal) return;
  const { key, mode, id } = activeModal;
  const config = modules[key];
  const data = new FormData(form);
  const cells = config.fields.map(([field]) => String(data.get(field) || '').trim());
  try {
    if (mode === 'edit') await store.update(key, id, cells); else await store.create(key, cells);
    closeModal(); render(); toast(`${recordLabel(config)} ${mode === 'edit' ? 'updated' : 'created'} successfully.`);
  } catch (error) { toast(error.message || 'Could not save this record.'); }
}

function exportCSV() {
  const { key } = currentRoute();
  if (!modules[key]) return;
  const config = modules[key];
  const csvCell = value => {
    let text = String(value ?? '');
    if (/^\s*[=+\-@]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"','""')}"`;
  };
  const csv = [config.columns, ...store.list(key).map(item => item.cells)]
    .map(row => row.map(csvCell).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${key}-gelato-grand.csv`; anchor.click(); URL.revokeObjectURL(url);
  toast(`${config.title} exported as CSV.`);
}

function downloadBackup() {
  const blob = new Blob([JSON.stringify(store.exportBackup(), null, 2)], { type:'application/json' });
  const url = URL.createObjectURL(blob); const anchor = document.createElement('a');
  anchor.href = url; anchor.download = `gelato-house-backup-${new Date().toISOString().slice(0,10)}.json`; anchor.click();
  URL.revokeObjectURL(url); toast('Property data backup downloaded.');
}

function applyTableFilters() {
  const rows = [...document.querySelectorAll('#records-body tr')];
  const query = (document.querySelector('#record-search')?.value || '').toLowerCase();
  const status = document.querySelector('#status-filter')?.value.toLowerCase() || '';
  let count = 0;
  for (const row of rows) {
    const visible = row.textContent.toLowerCase().includes(query) && (!status || row.textContent.toLowerCase().includes(status));
    row.hidden = !visible; if (visible) count++;
  }
  const empty = document.querySelector('#empty-state');
  if (empty) empty.hidden = count > 0;
  const total = document.querySelector('#result-count');
  if (total) total.textContent = `Showing ${count} of ${rows.length} records`;
}

document.addEventListener('click', async event => {
  const routeLink = event.target.closest('[data-route]');
  if (routeLink) {
    event.preventDefault();
    const action = routeLink.dataset.action;
    navigate(routeLink.dataset.route);
    document.querySelector('#sidebar')?.classList.remove('mobile-open');
    if (action === 'create-reservation') showModal('reservations');
    return;
  }
  const target = event.target.closest('[data-action]');
  if (target) {
    const action = target.dataset.action;
    if (action === 'create') { const { key } = currentRoute(); showModal(key); }
    if (action === 'edit') { const { key } = currentRoute(); showModal(key, 'edit', target.dataset.id); }
    if (action === 'edit-reservation') showModal('reservations', 'edit', target.dataset.id);
    if (action === 'advance') { const { key } = currentRoute(); await advanceRecord(key, target.dataset.id); }
    if (action === 'cancel-reservation') { if (confirm('Cancel this reservation and release the room if it is still held?')) await advanceRecord('reservations', target.dataset.id, 'Cancelled'); }
    if (action === 'delete') {
      const { key } = currentRoute();
      if (confirm('Delete this record from the property?')) { try { await store.remove(key, target.dataset.id); render(); toast('Record deleted.'); } catch (error) { toast(error.message || 'Could not delete this record.'); } }
    }
    if (action === 'export') exportCSV();
    if (action === 'backup') downloadBackup();
    if (action === 'refresh-audit') { await store.refresh(); render(); toast('Audit history refreshed.'); }
    if (action === 'reset-demo' && confirm('Restore all starter sample records? This replaces demo changes saved in this browser.')) { try { await store.reset(); render(); toast('Starter sample data restored.'); } catch (error) { toast(error.message || 'Could not reset demo data.'); } }
    if (action === 'close-modal') { if (target.classList.contains('modal-backdrop') && event.target !== target) return; closeModal(); }
    if (action === 'mobile-menu') document.querySelector('#sidebar')?.classList.toggle('mobile-open');
    if (action === 'notifications') toast('You’re all caught up ✨');
    if (action === 'support') toast('Support desk: help@gelatohouse.example · available 24/7');
    if (action === 'property') toast('The Gelato Grand · Goa, India');
    if (action === 'global-search') { const input = document.querySelector('#record-search'); if(input) input.focus(); else navigate('/reservations'); }
    if (action === 'today') toast(`Showing hotel activity for ${displayToday('Asia/Kolkata')}.`);
    if (action === 'calendar-prev') { calendarOffset -= 7; render(); }
    if (action === 'calendar-next') { calendarOffset += 7; render(); }
    if (action === 'calendar-today') { calendarOffset = 0; render(); }
    if (action === 'user-menu') toast('Signed in as Aarav Mehta · Property manager');
    return;
  }
  const workflowTab = event.target.closest('[data-workflow]');
  if (workflowTab) {
    const { key } = currentRoute();
    const view = resolveWorkflowAction(key, workflowTab.dataset.workflow);
    if (view.route) {
      navigate(view.route);
      if (view.query) { const search = document.querySelector('#record-search'); if (search) { search.value = view.query; applyTableFilters(); } }
      return;
    }
    document.querySelectorAll('.workflow-tab').forEach(tab => tab.classList.toggle('selected', tab === workflowTab));
    selectedWorkflow = workflowTab.dataset.workflow;
    const title = document.querySelector('#table-title'); if (title) title.textContent = selectedWorkflow;
    const subtitle = document.querySelector('.data-card .card-heading p'); if (subtitle) subtitle.textContent = `Showing ${selectedWorkflow.toLowerCase()} · ${store.list(currentRoute().key).length} property records`;
    const search = document.querySelector('#record-search'); const status = document.querySelector('#status-filter');
    if (search) search.value = view.query || '';
    if (status) status.value = view.status || '';
    applyTableFilters();
  }
});

document.addEventListener('input', event => { if (event.target.id === 'record-search') applyTableFilters(); });
document.addEventListener('input', event => {
  if (event.target.id === 'audit-search') {
    const query = event.target.value.toLowerCase(); let visible = 0;
    document.querySelectorAll('#audit-body tr').forEach(row => { const match = row.innerText.toLowerCase().includes(query); row.hidden = !match; if (match) visible++; });
    const empty = document.querySelector('#app .empty-state'); if (empty) empty.hidden = visible > 0;
  }
});
document.addEventListener('change', event => { if (event.target.id === 'status-filter') applyTableFilters(); });
document.addEventListener('submit', async event => {
  if (event.target.id === 'record-form') { event.preventDefault(); if (event.target.reportValidity()) await saveRecord(event.target); }
});
document.addEventListener('keydown', event => { if (event.key === 'Escape' && activeModal) closeModal(); });
window.addEventListener('hotel-data-updated', () => { if (!activeModal) render(); });
window.addEventListener('hotel-connectivity-updated', () => { if (!activeModal) render(); });
listenRoute(render);
await store.ready;
render();
window.setInterval(() => store.refresh(), 15000);
