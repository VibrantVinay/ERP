import { Router } from 'express';
import { inventoryController } from './controller';

const router = Router();

router.get('/items', (req, res, next) => inventoryController.getItems(req, res, next));
router.post('/items', (req, res, next) => inventoryController.createItem(req, res, next));
router.get('/alerts', (req, res, next) => inventoryController.getAlerts(req, res, next));
router.get('/locations', (req, res, next) => inventoryController.getLocations(req, res, next));
router.post('/batches', (req, res, next) => inventoryController.addBatch(req, res, next));
router.get('/items/:id', (req, res, next) => inventoryController.getItemById(req, res, next));
router.patch('/items/:id/stock', (req, res, next) => inventoryController.adjustStock(req, res, next));

export const inventoryRouter = router;
