export function escapeHTML(value = '') {
  return String(value).replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]);
}

export function initials(name = '') { return name.split(/\s+/).filter(Boolean).slice(0,2).map(part => part[0]).join('').toUpperCase() || 'GH'; }

export function badgeClass(value = '') {
  const word = String(value).toLowerCase();
  if (/paid|ready|resolved|complete|connected|confirmed|occupied|on shift|delivered|received|active|served|checked in/.test(word)) return 'good';
  if (/urgent|cancel|out of stock|attention|overdue|high/.test(word)) return 'alert';
  if (/pending|due|draft|enquiry|tentative|to clean|requested|inspection|low stock|in progress/.test(word)) return 'warm';
  return 'neutral';
}

export function money(value) { return `₹${Number(value || 0).toLocaleString('en-IN')}`; }

export function displayValue(value, column = '') {
  const text = String(value ?? '');
  if (/arrival|departure|date/i.test(column) && /^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return new Intl.DateTimeFormat('en-IN', { timeZone:'Asia/Kolkata', day:'numeric', month:'short', year:'numeric' }).format(new Date(`${text}T12:00:00+05:30`));
  }
  return text;
}
