import { Router } from 'express';
import { deliveryController } from './controller';

const router = Router();

router.get('/dispatches', (req, res, next) => deliveryController.getDispatches(req, res, next));
router.post('/dispatches', (req, res, next) => deliveryController.createDispatch(req, res, next));
router.get('/dispatches/:id', (req, res, next) => deliveryController.getDispatchById(req, res, next));
router.post('/dispatches/:id/assign', (req, res, next) => deliveryController.assignDriver(req, res, next));
router.patch('/dispatches/:id/status', (req, res, next) => deliveryController.updateStatus(req, res, next));
router.get('/drivers', (req, res, next) => deliveryController.getDrivers(req, res, next));
router.patch('/drivers/:id/status', (req, res, next) => deliveryController.updateDriverStatus(req, res, next));
router.get('/zones', (req, res, next) => deliveryController.getZones(req, res, next));

export const deliveryRouter = router;

