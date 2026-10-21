import { PluggableApp } from '../../core/base-app';
import { loyaltyRouter } from './routes';
import { loyaltyService } from './service';

export const loyaltyApp: PluggableApp = {
  id: 'loyalty',
  name: 'Promotions & Loyalty Rewards',
  routePrefix: '/loyalty',
  router: loyaltyRouter,
  async init() {
    await loyaltyService.initDatabaseSchema();
  },
};
