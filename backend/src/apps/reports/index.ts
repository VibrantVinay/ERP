import { PluggableApp } from '../../core/base-app';
import reportsRouter from './routes';
import { reportsService } from './service';

export const reportsApp: PluggableApp = {
  id: 'reports',
  name: 'Analytics, Intelligence & Reports',
  routePrefix: '/reports',
  router: reportsRouter,
  async init() {
    await reportsService.initDatabaseSchema();
  },
};

