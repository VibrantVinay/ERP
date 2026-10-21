import { PluggableApp } from '../../core/base-app';
import { inventoryRouter } from './routes';
import { inventoryService } from './service';

export const inventoryApp: PluggableApp = {
  id: 'inventory',
  name: 'Inventory & Batch Control',
  routePrefix: '/inventory',
  router: inventoryRouter,
  async init() {
    await inventoryService.initDatabaseSchema();
  },
};
