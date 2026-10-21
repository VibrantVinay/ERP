import { PluggableApp } from '../../core/base-app';
import { supplierRouter } from './routes';
import { supplierService } from './service';

export const suppliersApp: PluggableApp = {
  id: 'suppliers',
  name: 'Suppliers & Procurement',
  routePrefix: '/suppliers',
  router: supplierRouter,
  async init() {
    await supplierService.initDatabaseSchema();
  },
};

