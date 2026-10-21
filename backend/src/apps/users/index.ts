import { PluggableApp } from '../../core/base-app';
import userRouter from './routes';
import { userService } from './service';

export const usersApp: PluggableApp = {
  id: 'users',
  name: 'User RBAC & Permission Governance',
  routePrefix: '/users',
  router: userRouter,
  async init() {
    await userService.initDatabaseSchema();
  },
};
