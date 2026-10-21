import { PluggableApp } from '../../core/base-app';
import { menuRouter } from './routes';
import { menuService } from './service';

export const menuApp: PluggableApp = {
  id: 'menu',
  name: 'Menu & Modifiers Catalog',
  routePrefix: '/menu',
  router: menuRouter,
  async init() {
    await menuService.initDatabaseSchema();
  },
};
