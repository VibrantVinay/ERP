export function todayISO(timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone) {
  const values = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone, year:'numeric', month:'2-digit', day:'2-digit' }).formatToParts(new Date()).map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function dateOffset(days, timeZone) {
  const [year, month, day] = todayISO(timeZone).split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0,10);
}

export function displayToday(timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone) {
  return new Intl.DateTimeFormat('en-IN', { timeZone, weekday:'long', year:'numeric', month:'long', day:'numeric' }).format(new Date());
}
