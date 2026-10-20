import { Router } from 'express';
import { orderController } from './controller';

const router = Router();

router.get('/', orderController.getAll.bind(orderController));
router.get('/:id', orderController.getById.bind(orderController));
router.post('/', orderController.create.bind(orderController));
router.patch('/:id/status', orderController.updateStatus.bind(orderController));

export const orderRouter = router;

