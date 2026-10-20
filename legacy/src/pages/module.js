import { store } from '../core/store.js';
import { escapeHTML, badgeClass, initials, displayValue } from '../core/format.js';

const workflow = {
 orders:['All tickets','Dine-in','Takeaway','Delivery','QR order'], kitchen:['All stations','New','Preparing','Ready','Delayed'], tables:['All tables','Available','Reserved','Dining','Needs cleaning'], reservations:['All bookings','Confirmed','Arrived','Waitlisted','Cancelled'], delivery:['All deliveries','Preparing','On the way','Delayed','Delivered'], menu:['All dishes','Small plates','Mains','Sides','Desserts','Drinks'], inventory:['All ingredients','Low stock','Expiring soon','Out of stock'], suppliers:['All orders','Pending approval','Ordered','Received'], stockMovements:['All movements','Waste','Transfer','Adjustment'], customers:['All customers','New','Regular','VIP','At risk'], loyalty:['All offers','Active','Scheduled','Expired'], feedback:['All feedback','New','In progress','Resolved','Escalated'], staff:['All team','On shift','Scheduled','Late','On leave'], tasks:['All checks','Open','Needs attention','Overdue','Complete'], finance:['All entries','Due','Pending','Reconciled','Refunded'], reports:['All reports','Ready','Scheduled'], branches:['All branches','Open','Opening soon','Closed'], users:['All users','Active','Invite pending','Suspended'], settings:['All settings','Setup needed','Connected','Demo only']
};

const statusFlow = {orders:['New','Accepted','Preparing','Ready','Served','Dispatched','Completed'], kitchen:['New','Preparing','Ready','Served'], tables:['Available','Reserved','Seated','Ordering','Dining','Needs cleaning'], reservations:['Requested','Confirmed','Arrived','Seated','Completed'], delivery:['Queued','Preparing','Ready for pickup','Picked up','On the way','Delivered'], suppliers:['Draft','Pending approval','Approved','Ordered','Part received','Received','Paid'], stockMovements:['Waste','Transfer','Adjustment','Count variance'], loyalty:['Scheduled','Active','Paused','Expired'], feedback:['New','Assigned','In progress','Resolved'], staff:['Scheduled','On shift','Late','Off duty'], tasks:['Open','In progress','Passed','Complete'], finance:['Pending','Due','Paid','Reconciled'], reports:['Scheduled','Ready']};

const workflowActions = {};

export function nextStatus(key, current) {
  const flow = statusFlow[key] || [];
  return flow[flow.indexOf(current) + 1] || '';
}

export function resolveWorkflowAction(key, label) { return workflowActions[key]?.[label] || { query:label.startsWith('All') ? '' : label, status:'' }; }

function displayCell(value, column) {
  const safe = escapeHTML(displayValue(value, column));
  if (/status|priority/i.test(column)) return `<span class="status-pill ${badgeClass(value)}"><i></i>${safe}</span>`;
  if (/guest|team member|client/i.test(column)) return `<span class="person-cell"><span class="mini-avatar">${initials(value)}</span><b>${safe}</b></span>`;
  if (/amount|revenue|balance|total|rate/i.test(column) && /^\d/.test(String(value))) return `₹${Number(value).toLocaleString('en-IN')}`;
  return safe || '<span class="muted">—</span>';
}

export function renderModule(key, config) {
  const records = store.list(key);
  const tabs = workflow[key] || [];
  return `<section class="page-heading"><div><div class="eyebrow">${escapeHTML(config.eyebrow)}</div><h1>${escapeHTML(config.title)}</h1><p>${escapeHTML(config.description)}</p></div><div class="heading-actions">${key==='reports'?'<button class="button button-light" data-action="export">↧ &nbsp;Export</button>':''}<button class="button button-primary" data-action="create">＋ &nbsp;${escapeHTML(config.action)}</button></div></section>
    <section class="kpi-grid">${config.kpis.map(([label,value],index)=>`<article class="card kpi-card tone-${index%4}"><div class="kpi-top"><span>${escapeHTML(label)}</span><i>${['◷','↗','♙','✦'][index%4]}</i></div><strong>${escapeHTML(value)}</strong><small>${index===0?'Across Rift':'Updated just now'}</small></article>`).join('')}</section>
    <section class="workflow-tabs" role="tablist">${tabs.map((tab,index)=>`<button class="workflow-tab ${index===0?'selected':''}" role="tab" data-workflow="${escapeHTML(tab)}">${escapeHTML(tab)}</button>`).join('')}</section>
    <section class="card data-card"><header class="card-heading"><div><h2 id="table-title">${escapeHTML(tabs[0] || config.title)}</h2><p>${records.length} records · Live property data</p></div><div class="table-tools"><label class="search-box">⌕ <input id="record-search" placeholder="Search ${escapeHTML(config.title.toLowerCase())}…" /></label><select id="status-filter" class="select-filter" aria-label="Filter by status"><option value="">All statuses</option>${statusOptions(config).map(option=>`<option>${escapeHTML(option)}</option>`).join('')}</select><button class="button button-light compact" data-action="export">↧</button></div></header>
      <div class="table-scroll"><table><thead><tr>${config.columns.map(column=>`<th>${escapeHTML(column)}</th>`).join('')}<th class="actions-heading">Actions</th></tr></thead><tbody id="records-body">${renderRows(key, config, records)}</tbody></table><div id="empty-state" class="empty-state" ${records.length?'hidden':''}><span>✿</span><b>No records to show</b><p>Try changing your search or add a new record.</p><button class="button button-light" data-action="create">＋ Add a record</button></div></div>
      <footer class="table-footer"><span id="result-count">Showing ${records.length} of ${records.length} records</span><div class="pager"><button disabled>‹</button><b>1</b><button disabled>›</button></div></footer>
    </section>
    <section class="feature-strip"><div><span class="feature-spark">✦</span><b>${escapeHTML(config.title)} workspace</b><p>Use the workflow shortcuts above to keep the whole team in sync.</p></div><div class="feature-metrics"><span><b>${records.length}</b><small>Records here</small></span><span><b>${config.kpis[0]?.[1] || '—'}</b><small>${escapeHTML(config.kpis[0]?.[0] || 'Activity')}</small></span>${key==='settings'?'<button class="button button-light" data-action="backup">Download backup</button><button class="button button-light" data-action="reset-demo">Reset demo data</button>':''}</div></section>`;
}

function statusOptions(config) {
  const column = config.columns.findIndex(name => /status|priority/i.test(name));
  if (column < 0) return [];
  return [...new Set(config.fields.find(field => field[0] === 'status')?.[4] || [])];
}

export function renderRows(key, config, records) {
  if (!records.length) return '';
  return records.map(record => {
    const statusIndex = config.fields.findIndex(field => field[0] === 'status');
    const status = statusIndex >= 0 ? record.cells[statusIndex] : '';
    const next = nextStatus(key, status);
    const cancellable = key === 'reservations' && ['Pending','Confirmed'].includes(status);
    return `<tr data-record-id="${escapeHTML(record.id)}">${record.cells.map((cell,index)=>`<td>${displayCell(cell,config.columns[index] || '')}</td>`).join('')}<td class="row-actions">${key==='orders'?`<button class="row-action" title="Split bill" data-action="split-bill" data-id="${escapeHTML(record.id)}">½</button><button class="row-action" title="Merge into another ticket" data-action="merge-order" data-id="${escapeHTML(record.id)}">⇄</button>`:''}${next?`<button class="row-action advance-action" title="Move to ${escapeHTML(next)}" data-action="advance" data-id="${escapeHTML(record.id)}">→</button>`:''}<button class="row-action" title="Edit record" data-action="edit" data-id="${escapeHTML(record.id)}">✎</button><button class="row-action danger-action" title="Delete record" data-action="delete" data-id="${escapeHTML(record.id)}">⌫</button></td></tr>`;
  }).join('');
}
