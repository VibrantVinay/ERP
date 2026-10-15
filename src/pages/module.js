import { store } from '../core/store.js';
import { escapeHTML, badgeClass, initials, displayValue } from '../core/format.js';

const workflow = {
  reservations:['Reservation list','Calendar','Group blocks','Rate plans'], frontDesk:['Arrivals & departures','Check-in','Folio / billing','Room assignment'], rooms:['Room board','Room types','Amenities','Out of order'], housekeeping:['Task board','Assignments','Inspections','Lost & found'], guests:['Guest profiles','Companies','Loyalty','Guest history'], guestExperience:['Requests inbox','Guest messaging','Reviews','Service recovery'], restaurantPos:['Live orders','Tables','Menu & recipes','Kitchen display'], events:['Event diary','Enquiries','Proposals','Banquet orders'], channels:['Channel status','Rates & inventory','Restrictions','Sync log'], bookingEngine:['Booking overview','Rate plans','Promotions','Abandoned bookings'], spa:['Appointments','Treatment menu','Therapists','Memberships'], guestServices:['Laundry','Transport','Concierge','Service tracking'], inventory:['Stock on hand','Recipes & usage','Stock count','Wastage'], procurement:['Requests','Purchase orders','Suppliers','Receiving'], maintenance:['Work orders','Preventive plan','Assets','Vendors'], finance:['Transactions','Invoices','Guest folios','Reconciliation'], people:['Directory','Shift roster','Attendance','Payroll'], reports:['Operational','Revenue','Guest & channel','Exports'], settings:['Property profile','Room setup','Taxes & billing','Integrations']
};

const statusFlow = {
  reservations:['Pending','Confirmed','Checked in','Checked out'], frontDesk:['Expected','Checked in','Due out','Checked out'],
  housekeeping:['To clean','In progress','Inspection','Ready'], restaurantPos:['New','Preparing','Ready','Served','Paid'],
  events:['Enquiry','Proposal sent','Tentative','Confirmed','Completed'], channels:['Attention','Connected','Disconnected'],
  spa:['Confirmed','Checked in','Completed'], guestServices:['Requested','Picked up','In progress','Ready','Delivered','Completed'],
  procurement:['Draft','Pending approval','Approved','Ordered','Partially received','Received'],
  maintenance:['Urgent','Normal','In progress','Resolved'], reports:['Scheduled','Ready']
};

const workflowActions = {
  reservations:{'Calendar':{route:'/reservation-calendar'},'Group blocks':{route:'/events'},'Rate plans':{route:'/booking-engine'}},
  frontDesk:{'Arrivals & departures':{clear:true},'Check-in':{status:'Expected'},'Folio / billing':{route:'/finance'},'Room assignment':{route:'/rooms'}},
  rooms:{'Room board':{clear:true},'Room types':{route:'/settings',query:'Room types'},'Amenities':{route:'/settings',query:'Amenities'},'Out of order':{query:'Out of order'}},
  housekeeping:{'Task board':{clear:true},'Assignments':{status:'In progress'},'Inspections':{query:'Inspection'},'Lost & found':{route:'/guest-experience'}},
  guests:{'Guest profiles':{clear:true},'Companies':{query:'company'},'Loyalty':{query:'Gold'},'Guest history':{query:'stay'}},
  guestExperience:{'Requests inbox':{clear:true},'Guest messaging':{query:'WhatsApp'},'Reviews':{route:'/reports'},'Service recovery':{status:'Open'}},
  restaurantPos:{'Live orders':{clear:true},'Tables':{query:'Table'},'Menu & recipes':{route:'/inventory'},'Kitchen display':{status:'Preparing'}},
  events:{'Event diary':{clear:true},'Enquiries':{status:'Enquiry'},'Proposals':{status:'Proposal sent'},'Banquet orders':{query:'Banquet'}},
  channels:{'Channel status':{clear:true},'Rates & inventory':{route:'/booking-engine'},'Restrictions':{route:'/settings',query:'Restrictions'},'Sync log':{route:'/audit'}},
  bookingEngine:{'Booking overview':{clear:true},'Rate plans':{clear:true},'Promotions':{query:'Weekend'},'Abandoned bookings':{status:'Pending'}},
  spa:{'Appointments':{clear:true},'Treatment menu':{query:'massage'},'Therapists':{query:'Meera'},'Memberships':{route:'/guests',query:'Gold'}},
  guestServices:{'Laundry':{query:'Laundry'},'Transport':{query:'transfer'},'Concierge':{query:'Concierge'},'Service tracking':{clear:true}},
  inventory:{'Stock on hand':{clear:true},'Recipes & usage':{route:'/restaurant-pos'},'Stock count':{query:'Low stock'},'Wastage':{query:'waste'}},
  procurement:{'Requests':{status:'Draft'},'Purchase orders':{clear:true},'Suppliers':{query:'supplier'},'Receiving':{status:'Received'}},
  maintenance:{'Work orders':{clear:true},'Preventive plan':{query:'preventive'},'Assets':{query:'asset'},'Vendors':{route:'/procurement'}},
  finance:{'Transactions':{clear:true},'Invoices':{query:'INV-'},'Guest folios':{query:'Room'},'Reconciliation':{status:'Due'}},
  people:{'Directory':{clear:true},'Shift roster':{query:'AM'},'Attendance':{status:'On shift'},'Payroll':{status:'Upcoming'}},
  reports:{'Operational':{clear:true},'Revenue':{query:'revenue'},'Guest & channel':{query:'channel'},'Exports':{status:'Ready'}},
  settings:{'Property profile':{clear:true},'Room setup':{query:'Room'},'Taxes & billing':{query:'Taxes'},'Integrations':{query:'integration'}}
};

export function nextStatus(key, current) {
  const flow = statusFlow[key] || [];
  return flow[flow.indexOf(current) + 1] || '';
}

export function resolveWorkflowAction(key, label) { return workflowActions[key]?.[label] || { clear:true }; }

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
    <section class="kpi-grid">${config.kpis.map(([label,value],index)=>`<article class="card kpi-card tone-${index%4}"><div class="kpi-top"><span>${escapeHTML(label)}</span><i>${['◷','↗','♙','✦'][index%4]}</i></div><strong>${escapeHTML(value)}</strong><small>${index===0?'Across The Gelato Grand':'Updated just now'}</small></article>`).join('')}</section>
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
    return `<tr data-record-id="${escapeHTML(record.id)}">${record.cells.map((cell,index)=>`<td>${displayCell(cell,config.columns[index] || '')}</td>`).join('')}<td class="row-actions">${next?`<button class="row-action advance-action" title="Move to ${escapeHTML(next)}" data-action="advance" data-id="${escapeHTML(record.id)}">→</button>`:''}${cancellable?`<button class="row-action danger-action" title="Cancel reservation" data-action="cancel-reservation" data-id="${escapeHTML(record.id)}">×</button>`:''}<button class="row-action" title="Edit record" data-action="edit" data-id="${escapeHTML(record.id)}">✎</button><button class="row-action danger-action" title="Delete record" data-action="delete" data-id="${escapeHTML(record.id)}">⌫</button></td></tr>`;
  }).join('');
}
