import { PluggableApp } from '../../core/base-app';
import tasksRouter from './routes';
import { tasksService } from './service';

export const tasksApp: PluggableApp = {
  id: 'tasks',
  name: 'Food Safety & Operational Checklists',
  routePrefix: '/tasks',
  router: tasksRouter,
  async init() {
    await tasksService.initDatabaseSchema();
  },
};

