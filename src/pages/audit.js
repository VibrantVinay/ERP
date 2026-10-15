import { store } from '../core/store.js';
import { escapeHTML } from '../core/format.js';

function prettyDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('en-IN', { dateStyle:'medium', timeStyle:'short', timeZone:'Asia/Kolkata' }).format(date);
}

export function renderAudit() {
  const entries = store.audit();
  return `<section class="page-heading"><div><div class="eyebrow">ADMINISTRATION · CHANGE HISTORY</div><h1>Audit history</h1><p>Recent staff actions recorded by this property workspace.</p></div><div class="heading-actions"><button class="button button-light" data-action="refresh-audit">↻ &nbsp;Refresh</button></div></section>
    <section class="kpi-grid"><article class="card kpi-card tone-0"><div class="kpi-top"><span>Recent changes</span><i>◷</i></div><strong>${entries.length}</strong><small>Latest 100 records</small></article><article class="card kpi-card tone-1"><div class="kpi-top"><span>Data storage</span><i>▣</i></div><strong>${store.connected()?'Server':'Browser'}</strong><small>${store.connected()?'Shared property file':'This browser only'}</small></article></section>
    <section class="card data-card"><header class="card-heading"><div><h2>Activity log</h2><p>Create, update, delete, and demo reset events · Local times shown in Asia/Kolkata</p></div><label class="search-box">⌕ <input id="audit-search" placeholder="Search activity…" /></label></header><div class="table-scroll"><table><thead><tr><th>Action</th><th>Module</th><th>Record ID</th><th>Staff member</th><th>Date & time</th></tr></thead><tbody id="audit-body">${entries.map(item=>`<tr><td><span class="status-pill ${item.action==='deleted'?'alert':item.action==='created'?'good':'warm'}"><i></i>${escapeHTML(item.action)}</span></td><td>${escapeHTML(item.module)}</td><td>${escapeHTML(item.recordId || '—')}</td><td>${escapeHTML(item.actor)}</td><td>${escapeHTML(prettyDate(item.at))}</td></tr>`).join('')}</tbody></table><div class="empty-state" ${entries.length?'hidden':''}><span>✿</span><b>No changes recorded yet</b><p>Changes made in the operations modules will appear here.</p></div></div></section>`;
}
