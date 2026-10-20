import { PluggableApp } from '../../core/base-app';
import { kitchenRouter } from './routes';

export const kitchenApp: PluggableApp = {
  id: 'kitchen',
  name: 'Kitchen Display System',
  routePrefix: '/kitchen',
  router: kitchenRouter,
};

