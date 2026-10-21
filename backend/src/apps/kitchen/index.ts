import { PluggableApp } from '../../core/base-app';
import { kitchenRouter } from './routes';
import { kitchenService } from './service';

export const kitchenApp: PluggableApp = {
  id: 'kitchen',
  name: 'Kitchen Display System (KDS)',
  routePrefix: '/kitchen',
  router: kitchenRouter,
  async init() {
    await kitchenService.initDatabaseSchema();
  },
};
