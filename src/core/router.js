import { modules } from '../data/modules.js';

const routeKeys = Object.keys(modules).reduce((map, key) => { map[modules[key].path] = key; return map; }, {});
routeKeys['/'] = 'dashboard';
routeKeys['/dashboard'] = 'dashboard';
routeKeys['/audit'] = 'audit';
routeKeys['/reservation-calendar'] = 'calendar';

export function currentRoute() { return { path: location.pathname, key: routeKeys[location.pathname] || 'dashboard' }; }
export function navigate(path) {
  if (location.pathname !== path) history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}
export function listenRoute(callback) { window.addEventListener('popstate', callback); }
