import { PluggableApp } from '../../core/base-app';
import { menuRouter } from './routes';

export const menuApp: PluggableApp = {
  id: 'menu',
  name: 'Menu & Modifiers',
  routePrefix: '/menu',
  router: menuRouter,
};

