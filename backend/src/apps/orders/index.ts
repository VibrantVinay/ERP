import { PluggableApp } from '../../core/base-app';
import { orderRouter } from './routes';

export const ordersApp: PluggableApp = {
  id: 'orders',
  name: 'Orders Register',
  routePrefix: '/orders',
  router: orderRouter,
};

