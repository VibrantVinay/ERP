import { Router } from 'express';
import { inventoryController } from './controller';

const router = Router();

router.get('/', inventoryController.getAll.bind(inventoryController));
router.get('/alerts', inventoryController.getAlerts.bind(inventoryController));
router.patch('/:id/stock', inventoryController.updateStock.bind(inventoryController));

export const inventoryRouter = router;

