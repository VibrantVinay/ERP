import { PluggableApp } from '../../core/base-app';
import settingsRouter from './routes';
import { settingsService } from './service';

export const settingsApp: PluggableApp = {
  id: 'settings',
  name: 'System Configuration & Hardware Integrations',
  routePrefix: '/settings',
  router: settingsRouter,
  async init() {
    await settingsService.initDatabaseSchema();
  },
};

