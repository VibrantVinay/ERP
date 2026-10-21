import { Router } from 'express';
import { supplierController } from './controller';

export const supplierRouter = Router();

// Purchase Orders Routes (placed before :id to prevent path collision)
supplierRouter.get('/orders', (req, res, next) => supplierController.getPurchaseOrders(req, res, next));
supplierRouter.post('/orders', (req, res, next) => supplierController.createPurchaseOrder(req, res, next));
supplierRouter.get('/orders/:id', (req, res, next) => supplierController.getPOById(req, res, next));
supplierRouter.patch('/orders/:id/status', (req, res, next) => supplierController.updatePOStatus(req, res, next));

// Suppliers Directory Routes
supplierRouter.get('/', (req, res, next) => supplierController.getSuppliers(req, res, next));
supplierRouter.post('/', (req, res, next) => supplierController.createSupplier(req, res, next));
supplierRouter.get('/:id', (req, res, next) => supplierController.getSupplierById(req, res, next));

