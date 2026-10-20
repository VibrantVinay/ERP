import { Router } from 'express';
import { kitchenController } from './controller';

const router = Router();

router.get('/tickets', kitchenController.getTickets.bind(kitchenController));
router.post('/tickets', kitchenController.addTicket.bind(kitchenController));
router.patch('/tickets/:id/status', kitchenController.updateStatus.bind(kitchenController));

export const kitchenRouter = router;

