import { store } from '../core/store.js';
import { dateOffset } from '../core/dates.js';
import { escapeHTML } from '../core/format.js';

function calendarDays(offset) {
  return Array.from({ length:7 }, (_,index) => dateOffset(offset + index, 'Asia/Kolkata'));
}

function shortDate(value) {
  return new Intl.DateTimeFormat('en-IN', { timeZone:'Asia/Kolkata', weekday:'short', day:'numeric', month:'short' }).format(new Date(`${value}T12:00:00+05:30`));
}

export function renderCalendar(offset = 0) {
  const days = calendarDays(offset);
  const rooms = store.list('rooms');
  const bookings = store.list('reservations');
  const occupiedCount = rooms.filter(room => /occupied/i.test(room.cells[5] || '')).length;
  const label = `${shortDate(days[0])} — ${shortDate(days.at(-1))}`;
  const roomRows = rooms.map(room => {
    const roomNumber = String(room.cells[0]);
    const blocks = bookings.flatMap(booking => {
      if (String(booking.cells[2] || '').split(' · ')[0].trim() !== roomNumber) return [];
      const arrival = Date.parse(`${booking.cells[3]}T00:00:00Z`);
      const departure = Date.parse(`${booking.cells[4]}T00:00:00Z`);
      const weekStart = Date.parse(`${days[0]}T00:00:00Z`);
      const start = Math.max(0, Math.round((arrival - weekStart) / 86400000));
      const end = Math.min(7, Math.round((departure - weekStart) / 86400000));
      if (end <= start || end < 0 || start > 6 || /cancelled/i.test(booking.cells[6] || '')) return [];
      const status = String(booking.cells[6] || '').toLowerCase().replaceAll(' ','-');
      return [`<button class="stay-block ${escapeHTML(status)}" style="grid-column:${start + 1}/span ${end - start}" data-action="edit-reservation" data-id="${escapeHTML(booking.id)}" title="${escapeHTML(booking.cells[0])} · ${escapeHTML(booking.cells[3])} to ${escapeHTML(booking.cells[4])}"><b>${escapeHTML(booking.cells[0])}</b><small>${escapeHTML(booking.cells[1])} · ${escapeHTML(booking.cells[6])}</small></button>`];
    }).join('');
    return `<div class="calendar-row"><div class="calendar-room"><b>${escapeHTML(room.cells[0])}</b><small>${escapeHTML(room.cells[1])} · ${escapeHTML(room.cells[5])}</small></div><div class="calendar-track">${days.map(()=>'<span class="calendar-cell"></span>').join('')}${blocks}</div></div>`;
  }).join('');
  return `<section class="page-heading"><div><div class="eyebrow">ROOMS & STAYS · PLANNING BOARD</div><h1>Reservation calendar</h1><p>See room stays across the week and open any booking to edit its details.</p></div><div class="heading-actions"><button class="button button-light" data-route="/reservations">Reservation list</button><button class="button button-primary" data-route="/reservations" data-action="create-reservation">＋ &nbsp;New reservation</button></div></section>
    <section class="card calendar-card"><header class="calendar-toolbar"><div><h2>${escapeHTML(label)}</h2><p>${rooms.length} room records · ${bookings.length} reservation records</p></div><div class="calendar-controls"><button class="button button-light" data-action="calendar-today">Today</button><button class="icon-button" data-action="calendar-prev" aria-label="Previous week">‹</button><button class="icon-button" data-action="calendar-next" aria-label="Next week">›</button></div></header><div class="calendar-summary"><span><i class="legend-dot occupied"></i>${occupiedCount} occupied room records</span><span><i class="legend-dot available"></i>${Math.max(0,rooms.length-occupiedCount)} other room records</span><span class="muted">Bookings are shown for their arrival and departure dates.</span></div><div class="calendar-scroll"><div class="calendar-grid"><div class="calendar-head"><span class="calendar-room-head">ROOM</span><div class="calendar-days">${days.map(day=>`<span>${escapeHTML(shortDate(day))}</span>`).join('')}</div></div>${roomRows || '<div class="calendar-empty">No rooms have been configured yet.</div>'}</div></div></section>`;
}
