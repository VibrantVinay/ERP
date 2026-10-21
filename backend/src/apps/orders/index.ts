import { PluggableApp } from '../../core/base-app';
import { orderRouter } from './routes';
import { orderService } from './service';

export const ordersApp: PluggableApp = {
  id: 'orders',
  name: 'Order Lifecycle & Registry',
  routePrefix: '/orders',
  router: orderRouter,
  async init() {
    await orderService.initDatabaseSchema();
  },
};
