import { PluggableApp } from '../../core/base-app';
import { stockMovementRouter } from './routes';
import { stockMovementService } from './service';

export const stockMovementsApp: PluggableApp = {
  id: 'stock_movements',
  name: 'Waste, Transfers & Adjustments',
  routePrefix: '/stock-movements',
  router: stockMovementRouter,
  async init() {
    await stockMovementService.initDatabaseSchema();
  },
};
