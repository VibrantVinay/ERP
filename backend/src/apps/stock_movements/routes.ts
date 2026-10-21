import { Router } from 'express';
import { stockMovementController } from './controller';

export const stockMovementRouter = Router();

// Variance summary placed before :id
stockMovementRouter.get('/variance-summary', (req, res, next) => stockMovementController.getVarianceSummary(req, res, next));
stockMovementRouter.get('/', (req, res, next) => stockMovementController.getMovements(req, res, next));
stockMovementRouter.post('/', (req, res, next) => stockMovementController.createMovement(req, res, next));
stockMovementRouter.get('/:id', (req, res, next) => stockMovementController.getMovementById(req, res, next));

