import { PluggableApp } from '../../core/base-app';
import { deliveryRouter } from './routes';
import { deliveryService } from './service';

export const deliveryApp: PluggableApp = {
  id: 'delivery',
  name: 'Delivery Operations & Dispatch',
  routePrefix: '/delivery',
  router: deliveryRouter,
  async init() {
    await deliveryService.initDatabaseSchema();
  },
};

