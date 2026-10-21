import { PluggableApp } from '../../core/base-app';
import { staffRouter } from './routes';
import { staffService } from './service';

export const staffApp: PluggableApp = {
  id: 'staff',
  name: 'Staff, Shifts & Attendance',
  routePrefix: '/staff',
  router: staffRouter,
  async init() {
    await staffService.initDatabaseSchema();
  },
};

