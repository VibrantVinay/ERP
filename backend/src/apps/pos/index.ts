import { PluggableApp } from '../../core/base-app';
import { posRouter } from './routes';

export const posApp: PluggableApp = {
  id: 'pos',
  name: 'Point of Sale',
  routePrefix: '/pos',
  router: posRouter,
};

