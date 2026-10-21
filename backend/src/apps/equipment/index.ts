import { PluggableApp } from '../../core/base-app';
import equipmentRouter from './routes';
import { equipmentService } from './service';

export const equipmentApp: PluggableApp = {
  id: 'equipment',
  name: 'Kitchen Asset Care & Maintenance',
  routePrefix: '/equipment',
  router: equipmentRouter,
  async init() {
    await equipmentService.initDatabaseSchema();
  },
};
