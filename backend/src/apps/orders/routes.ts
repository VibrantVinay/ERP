import { Router } from 'express';
import { orderController } from './controller';

const router = Router();

router.get('/', (req, res, next) => orderController.getOrders(req, res, next));
router.get('/:id', (req, res, next) => orderController.getOrderById(req, res, next));
router.post('/', (req, res, next) => orderController.createOrder(req, res, next));
router.patch('/:id/status', (req, res, next) => orderController.updateOrderStatus(req, res, next));
router.post('/:id/cancel', (req, res, next) => orderController.cancelOrder(req, res, next));
router.post('/merge', (req, res, next) => orderController.mergeOrders(req, res, next));

export const orderRouter = router;
