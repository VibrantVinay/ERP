import { PluggableApp } from '../../core/base-app';
import { posRouter } from './routes';
import { posService } from './service';

export const posApp: PluggableApp = {
  id: 'pos',
  name: 'Point of Sale',
  routePrefix: '/pos',
  router: posRouter,
  async init() {
    await posService.initDatabaseSchema();
  },
};
