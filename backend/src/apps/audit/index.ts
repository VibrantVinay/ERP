import { PluggableApp } from '../../core/base-app';
import auditRouter from './routes';
import { auditService } from './service';

export const auditApp: PluggableApp = {
  id: 'audit',
  name: 'Immutable Audit Trail & Activity Governance',
  routePrefix: '/audit',
  router: auditRouter,
  async init() {
    await auditService.initDatabaseSchema();
  },
};

