import { modules, menuItems } from './data/restaurant-modules.js';
import { currentRoute, navigate, listenRoute } from './core/router.js';
import { store } from './core/store.js';
import { renderLayout } from './components/layout.js';
import { modalMarkup } from './components/modal.js';
import { renderModule, nextStatus, resolveWorkflowAction } from './pages/module.js';
import { renderRestaurantDashboard } from './pages/restaurant-dashboard.js';
import { renderAudit } from './pages/audit.js';
import { renderPos } from './pages/pos.js';
import { displayToday, todayISO } from './core/dates.js';
import { renderLogin } from './pages/login.js';

const app = document.querySelector('#app');
let activeModal = null;
let cart = [];
let orderType = 'Dine-in';
let discount = 0;
let payment = 'Unpaid';
let posGuest = '';

function render() {
  const { path, key } = currentRoute();
  const content = key === 'dashboard' ? renderRestaurantDashboard()
    : key === 'audit' ? renderAudit()
    : key === 'pos' ? renderPos(cart, orderType, discount, payment)
    : renderModule(key, modules[key]);
  app.innerHTML = renderLayout(path, content, store.connected());
  document.title = `${key === 'dashboard' ? 'Overview' : key === 'audit' ? 'Audit log' : modules[key]?.title || 'Restaurant ERP'} · Rift`;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function showLogin(message = '') {
  let configured = false;
  try { const response = await fetch('/api/config', { credentials:'same-origin' }); configured = response.ok && (await response.json()).configured; } catch { /* Show setup instructions if the API is unavailable. */ }
  app.innerHTML = renderLogin({ configured, message });
  document.querySelector('#login-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget; const button = form.querySelector('button[type="submit"]'); button.disabled = true; button.textContent = 'Signing in…';
    try {
      const response = await fetch('/api/auth/login', { method:'POST', credentials:'same-origin', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email:form.elements.email.value,password:form.elements.password.value}) });
      const result = await response.json().catch(()=>({}));
      if (!response.ok) throw new Error(result.error || 'Could not sign in.');
      await startApp();
    } catch (error) { await showLogin(error.message || 'Could not sign in.'); }
  });
}

function toast(message) {
  const root = document.querySelector('#toast-root');
  const item = document.createElement('div'); item.className = 'toast-message'; item.textContent = message; root.append(item);
  window.setTimeout(() => item.remove(), 3200);
}

function showModal(key, mode = 'create', id = '') {
  const config = modules[key]; if (!config) return;
  const record = id ? store.list(key).find(item => item.id === id) : null;
  activeModal = { key, mode, id };
  document.querySelector('#overlay-root').innerHTML = modalMarkup({ title: mode === 'edit' ? `Edit ${config.title}` : config.action, fields:config.fields, values:record?.cells || [], mode });
  document.querySelector('.modal-backdrop').classList.add('visible');
  document.querySelector('.modal input, .modal select')?.focus();
}
function closeModal() { activeModal = null; document.querySelector('#overlay-root').innerHTML = ''; }

async function saveRecord(form) {
  if (!activeModal) return;
  const {key,mode,id} = activeModal; const data = new FormData(form); const cells = modules[key].fields.map(([field]) => String(data.get(field) || '').trim());
  try { if (mode === 'edit') await store.update(key,id,cells); else await store.create(key,cells); closeModal(); render(); toast(`${modules[key].title} ${mode === 'edit' ? 'updated' : 'added'}.`); }
  catch (error) { toast(error.message || 'Could not save that record.'); }
}

function exportCSV() {
  const {key}=currentRoute(); const config=modules[key]; if(!config)return;
  const quote=value=>`"${String(value??'').replaceAll('"','""')}"`;
  const csv=[config.columns,...store.list(key).map(record=>record.cells)].map(row=>row.map(quote).join(',')).join('\r\n');
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})); const a=document.createElement('a');a.href=url;a.download=`${key}-rift.csv`;a.click();URL.revokeObjectURL(url);toast(`${config.title} exported.`);
}

function applyFilters() {
  const rows=[...document.querySelectorAll('#records-body tr')];
  const query=(document.querySelector('#record-search')?.value||'').toLowerCase();
  const status=(document.querySelector('#status-filter')?.value||'').toLowerCase(); let count=0;
  for(const row of rows){const visible=row.textContent.toLowerCase().includes(query)&&(!status||row.textContent.toLowerCase().includes(status));row.hidden=!visible;if(visible)count++;}
  const empty=document.querySelector('#empty-state');if(empty)empty.hidden=count>0;
  const total=document.querySelector('#result-count');if(total)total.textContent=`Showing ${count} of ${rows.length} records`;
}

async function sendOrder() {
  if (!cart.length) return;
  const subtotal=cart.reduce((sum,item)=>sum+item.price*item.qty,0); const off=Math.min(100,Math.max(0,Number(discount)||0));
  const total=subtotal-Math.round(subtotal*off/100)+Math.round((subtotal-Math.round(subtotal*off/100))*.05);
  const ticket=`RF-${String(Date.now()).slice(-5)}`; const items=cart.map(item=>`${item.name} ×${item.qty}`).join(', ');
  try {
    await store.create('orders',[ticket,orderType,posGuest||'Walk-in',items,String(total),payment,'New']);
    await store.create('kitchen',[ticket,'Hot line',items,new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kolkata',hour:'2-digit',minute:'2-digit'}).format(new Date()),'0',cart.some(item=>item.note.toLowerCase().includes('allergy'))?'Allergy':'Normal','New']);
    await store.create('finance',[payment==='Unpaid'?'Invoice':'Sale',`BILL-${ticket}`,`POS sale · ${items}`,posGuest||'Walk-in',todayISO('Asia/Kolkata'),String(total),`${payment} · GST sample`,payment==='Unpaid'?'Due':'Paid']);
    cart=[];discount=0;posGuest='';render();toast(`${ticket} sent to the kitchen.`);
  } catch(error) { toast(error.message||'Could not send this ticket.'); }
}

function bindAppEvents() {
document.addEventListener('click', async event => {
  const routeLink=event.target.closest('[data-route]');
  if(routeLink){event.preventDefault();navigate(routeLink.dataset.route);document.querySelector('#sidebar')?.classList.remove('mobile-open');return;}
  const orderTypeButton=event.target.closest('[data-order-type]');
  if(orderTypeButton){posGuest=document.querySelector('#pos-table')?.value||posGuest;orderType=orderTypeButton.dataset.orderType;render();return;}
  const menuItem=event.target.closest('[data-pos-item]');
  if(menuItem){const item=menuItems[Number(menuItem.dataset.posItem)];const line=cart.find(x=>x.name===item.name);if(line)line.qty++;else cart.push({...item,qty:1});render();return;}
  const cartChange=event.target.closest('[data-cart-change]');
  if(cartChange){const i=Number(cartChange.dataset.cartChange);cart[i].qty+=Number(cartChange.dataset.delta);if(cart[i].qty<=0)cart.splice(i,1);render();return;}
  const category=event.target.closest('[data-menu-category]');
  if(category){document.querySelectorAll('[data-menu-category]').forEach(x=>x.classList.toggle('selected',x===category));const value=category.dataset.menuCategory;document.querySelectorAll('.menu-item-card').forEach(card=>card.hidden=value!=='All dishes'&&!card.dataset.category.includes(value));return;}
  const target=event.target.closest('[data-action]'); if(!target)return;
  const action=target.dataset.action;
  if(action==='create'){const {key}=currentRoute();showModal(key);}
  if(action==='edit'){const {key}=currentRoute();showModal(key,'edit',target.dataset.id);}
  if(action==='advance'){
    const {key}=currentRoute();const record=store.list(key).find(x=>x.id===target.dataset.id);const ix=modules[key]?.fields.findIndex(x=>x[0]==='status')??-1;
    if(record&&ix>=0){const next=nextStatus(key,record.cells[ix]);if(next){const cells=[...record.cells];cells[ix]=next;try{await store.update(key,record.id,cells);render();toast(`Moved to ${next}.`);}catch(error){toast(error.message);}}}
  }
  if(action==='split-bill'){
    const ticket=store.list('orders').find(x=>x.id===target.dataset.id);if(ticket){const raw=prompt(`Split ${ticket.cells[0]} into how many equal guest shares? Enter 2–8.`,'2');const count=Number(raw);if(Number.isInteger(count)&&count>=2&&count<=8){const total=Number(ticket.cells[4]||0);const part=Math.floor(total/count);try{for(let i=0;i<count;i++){const amount=i===count-1?total-part*(count-1):part;await store.create('finance',['Invoice',`SPL-${ticket.cells[0]}-${i+1}`,`Split bill · share ${i+1} of ${count}`,ticket.cells[2],todayISO('Asia/Kolkata'),String(amount),`${ticket.cells[5]} · split`,'Due']);}render();toast(`${ticket.cells[0]} split into ${count} unpaid shares.`);}catch(error){toast(error.message||'Could not split this bill.');}}}
  }
  if(action==='merge-order'){
    const source=store.list('orders').find(x=>x.id===target.dataset.id);const candidates=store.list('orders').filter(x=>x.id!==target.dataset.id&&!/completed|cancelled|merged/i.test(x.cells[6]||''));
    if(source&&candidates.length){const choice=prompt(`Merge ${source.cells[0]} into which open ticket? Enter the ticket number:\n${candidates.map(x=>x.cells[0]+' · '+x.cells[2]).join('\n')}`,candidates[0].cells[0]);const destination=candidates.find(x=>x.cells[0].toLowerCase()===String(choice||'').trim().toLowerCase());if(destination){const targetCells=[...destination.cells];targetCells[3]=[targetCells[3],source.cells[3]].filter(Boolean).join(', ');targetCells[4]=String(Number(targetCells[4]||0)+Number(source.cells[4]||0));const sourceCells=[...source.cells];sourceCells[6]='Merged';try{await store.update('orders',destination.id,targetCells);await store.update('orders',source.id,sourceCells);render();toast(`${source.cells[0]} merged into ${destination.cells[0]}.`);}catch(error){toast(error.message||'Could not merge these tickets.');}}}
    else toast('There are no other open tickets to merge into.');
  }
  if(action==='delete'){const {key}=currentRoute();if(confirm('Delete this record?')){try{await store.remove(key,target.dataset.id);render();toast('Record deleted.');}catch(error){toast(error.message);}}}
  if(action==='export')exportCSV();
  if(action==='backup'){const url=URL.createObjectURL(new Blob([JSON.stringify(store.exportBackup(),null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='rift-backup-'+new Date().toISOString().slice(0,10)+'.json';a.click();URL.revokeObjectURL(url);toast('Restaurant data backup downloaded.');}
  if(action==='reset-demo'&&confirm('Restore the restaurant demo data? This replaces local demo changes.')){try{await store.reset();render();toast('Restaurant sample data restored.');}catch(error){toast(error.message);}}
  if(action==='close-modal'){if(target.classList.contains('modal-backdrop')&&event.target!==target)return;closeModal();}
  if(action==='mobile-menu')document.querySelector('#sidebar')?.classList.toggle('mobile-open');
  if(action==='notifications'){const delayed=store.list('kitchen').filter(x=>/delayed/i.test(x.cells[6]||'')).length;const low=store.list('inventory').filter(x=>/low|expiring|out of stock/i.test(x.cells[6]||'')).length;const checks=store.list('tasks').filter(x=>/attention|overdue/i.test(x.cells[5]||'')).length;toast(delayed+low+checks?`${delayed} delayed tickets · ${low} stock alerts · ${checks} safety checks need attention.`:'You’re all caught up.');}
  if(action==='support')toast('Restaurant support desk · help@rift.example');
  if(action==='property')toast('Rift · Panaji, Goa');
  if(action==='global-search'){const input=document.querySelector('#record-search');if(input)input.focus();else navigate('/orders');}
  if(action==='today')toast(`Service date: ${displayToday('Asia/Kolkata')}.`);
  if(action==='user-menu')toast('Rift restaurant workspace.');
  if(action==='logout'){try{await fetch('/api/auth/logout',{method:'POST',credentials:'same-origin'});}finally{await showLogin('You have signed out.');}}
  if(action==='send-order')await sendOrder();
  if(action==='refresh-audit'){await store.refresh();render();toast('Audit log refreshed.');}
});

document.addEventListener('input', event=>{
  if(event.target.id==='record-search')applyFilters();
  if(event.target.id==='menu-search'){const query=event.target.value.toLowerCase();document.querySelectorAll('.menu-item-card').forEach(card=>card.hidden=!card.innerText.toLowerCase().includes(query));}
  if(event.target.id==='pos-table')posGuest=event.target.value;
  if(event.target.id==='pos-discount')discount=event.target.value;
  if(event.target.id==='audit-search'){const q=event.target.value.toLowerCase();let visible=0;document.querySelectorAll('#audit-body tr').forEach(row=>{const match=row.innerText.toLowerCase().includes(q);row.hidden=!match;if(match)visible++;});const empty=document.querySelector('#app .empty-state');if(empty)empty.hidden=visible>0;}
});
document.addEventListener('change',event=>{if(event.target.id==='status-filter')applyFilters();if(event.target.id==='pos-payment'){payment=event.target.value;posGuest=document.querySelector('#pos-table')?.value||posGuest;render();}if(event.target.id==='pos-discount'){posGuest=document.querySelector('#pos-table')?.value||posGuest;render();}});
document.addEventListener('submit',async event=>{if(event.target.id==='record-form'){event.preventDefault();if(event.target.reportValidity())await saveRecord(event.target);}});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&activeModal)closeModal();});
window.addEventListener('restaurant-data-updated',()=>{if(!activeModal)render();});
window.addEventListener('restaurant-connectivity-updated',()=>{if(!activeModal)render();});
}

let appEventsBound = false;
async function startApp() {
  let session;
  try { session = await fetch('/api/auth/session', { credentials:'same-origin' }); }
  catch { await showLogin('Rift could not reach its API. Check the deployment and try again.'); return; }
  if (!session.ok) { await showLogin(); return; }
  await store.ready;
  await store.refresh();
  if (!store.connected()) { await showLogin('Could not connect to the restaurant database.'); return; }
  if (!appEventsBound) { bindAppEvents(); listenRoute(render); appEventsBound = true; window.setInterval(()=>store.refresh(),15000); }
  render();
}

await startApp();
