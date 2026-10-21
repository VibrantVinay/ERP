import { Router } from 'express';
import { customerController } from './controller';

export const customerRouter = Router();

// Order history route before generic :id
customerRouter.get('/:id/history', (req, res, next) => customerController.getCustomerHistory(req, res, next));
customerRouter.get('/', (req, res, next) => customerController.getCustomers(req, res, next));
customerRouter.post('/', (req, res, next) => customerController.createCustomer(req, res, next));
customerRouter.get('/:id', (req, res, next) => customerController.getCustomerById(req, res, next));
customerRouter.put('/:id', (req, res, next) => customerController.updateCustomer(req, res, next));

