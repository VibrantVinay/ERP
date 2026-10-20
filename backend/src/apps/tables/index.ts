import { PluggableApp } from '../../core/base-app';
import { tableRouter } from './routes';

export const tablesApp: PluggableApp = {
  id: 'tables',
  name: 'Tables & Floor Management',
  routePrefix: '/tables',
  router: tableRouter,
};

