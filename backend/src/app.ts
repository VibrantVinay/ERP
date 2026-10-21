import express, { Express } from 'express';
import cors from 'cors';
import { config } from './core/config';
import { AppRegistry } from './core/app-registry';
import { tenantContextMiddleware, requestLogger, globalErrorHandler } from './core/middleware';
import { sendSuccess } from './core/response';

// Import Pluggable Apps (Django INSTALLED_APPS pattern)
import { authApp } from './apps/auth';
import { posApp } from './apps/pos';
import { ordersApp } from './apps/orders';
import { kitchenApp } from './apps/kitchen';
import { tablesApp } from './apps/tables';
import { reservationsApp } from './apps/reservations';
import { deliveryApp } from './apps/delivery';
import { recipesApp } from './apps/recipes';
import { menuApp } from './apps/menu';
import { inventoryApp } from './apps/inventory';
import { suppliersApp } from './apps/suppliers';
import { stockMovementsApp } from './apps/stock_movements';
import { customersApp } from './apps/customers';
import { loyaltyApp } from './apps/loyalty';
import { feedbackApp } from './apps/feedback';
import { staffApp } from './apps/staff';
import { tasksApp } from './apps/tasks';
import { equipmentApp } from './apps/equipment';
import { financeApp } from './apps/finance';
import { reportsApp } from './apps/reports';
import { branchesApp } from './apps/branches';
import { usersApp } from './apps/users';
import { auditApp } from './apps/audit';

export const INSTALLED_APPS = [
  authApp,
  posApp,
  ordersApp,
  kitchenApp,
  tablesApp,
  reservationsApp,
  deliveryApp,
  recipesApp,
  menuApp,
  inventoryApp,
  suppliersApp,
  stockMovementsApp,
  customersApp,
  loyaltyApp,
  feedbackApp,
  staffApp,
  tasksApp,
  equipmentApp,
  financeApp,
  reportsApp,
  branchesApp,
  usersApp,
  auditApp,
];

export async function createApp(): Promise<Express> {
  const app = express();

  // Core Global Middlewares
  app.use(cors({ origin: config.corsOrigin, credentials: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);
  app.use(tenantContextMiddleware);

  // App Registry Instance
  const registry = new AppRegistry();
  registry.registerAll(INSTALLED_APPS);

  // Health and System Meta Endpoints
  app.get('/health', (req, res) => {
    return sendSuccess(res, { status: 'healthy', timestamp: new Date().toISOString() });
  });

  app.get(`${config.apiPrefix}/system/installed-apps`, (req, res) => {
    return sendSuccess(res, registry.getInstalledAppsInfo());
  });

  // Mount all Pluggable Apps
  await registry.mount(app);

  // Global Error Handler
  app.use(globalErrorHandler);

  return app;
}

