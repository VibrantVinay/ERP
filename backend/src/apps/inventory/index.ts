import { PluggableApp } from '../../core/base-app';
import { inventoryRouter } from './routes';

export const inventoryApp: PluggableApp = {
  id: 'inventory',
  name: 'Inventory & Stock Control',
  routePrefix: '/inventory',
  router: inventoryRouter,
};

