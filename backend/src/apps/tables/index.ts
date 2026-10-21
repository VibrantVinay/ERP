import { PluggableApp } from '../../core/base-app';
import { tableRouter } from './routes';
import { tableService } from './service';

export const tablesApp: PluggableApp = {
  id: 'tables',
  name: 'Floor & Table Management',
  routePrefix: '/tables',
  router: tableRouter,
  async init() {
    await tableService.initDatabaseSchema();
  },
};
