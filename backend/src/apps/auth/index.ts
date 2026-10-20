import { PluggableApp } from '../../core/base-app';
import { authRouter } from './routes';

export const authApp: PluggableApp = {
  id: 'auth',
  name: 'Authentication & Session',
  routePrefix: '/auth',
  router: authRouter,
};

