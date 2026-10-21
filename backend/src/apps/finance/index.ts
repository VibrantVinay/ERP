import { PluggableApp } from '../../core/base-app';
import financeRouter from './routes';
import { financeService } from './service';

export const financeApp: PluggableApp = {
  id: 'finance',
  name: 'Finance & Accounting Ledger',
  routePrefix: '/finance',
  router: financeRouter,
  async init() {
    await financeService.initDatabaseSchema();
  },
};

