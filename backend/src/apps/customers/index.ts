import { PluggableApp } from '../../core/base-app';
import { customerRouter } from './routes';
import { customerService } from './service';

export const customersApp: PluggableApp = {
  id: 'customers',
  name: 'Customers & Guest CRM',
  routePrefix: '/customers',
  router: customerRouter,
  async init() {
    await customerService.initDatabaseSchema();
  },
};

