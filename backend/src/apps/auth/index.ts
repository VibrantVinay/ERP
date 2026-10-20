import { PluggableApp } from '../../core/base-app';
import { authRouter } from './routes';
import { authService } from './service';

export const authApp: PluggableApp = {
  id: 'auth',
  name: 'Authentication & Session',
  routePrefix: '/auth',
  router: authRouter,
  async init() {
    await authService.initDatabaseSchema();
  },
};
