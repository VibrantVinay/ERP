import { PluggableApp } from '../../core/base-app';
import branchRouter from './routes';
import { branchService } from './service';

export const branchesApp: PluggableApp = {
  id: 'branches',
  name: 'Multi-Unit Branch & Outlet Management',
  routePrefix: '/branches',
  router: branchRouter,
  async init() {
    await branchService.initDatabaseSchema();
  },
};
