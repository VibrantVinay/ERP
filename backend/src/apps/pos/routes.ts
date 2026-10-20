import { Router } from 'express';
import { posController } from './controller';

const router = Router();

router.post('/calculate', posController.calculate.bind(posController));
router.post('/tickets', posController.createTicket.bind(posController));
router.get('/tickets/active', posController.getActiveTickets.bind(posController));
router.get('/tickets/:id', posController.getTicketById.bind(posController));
router.post('/tickets/:id/pay', posController.payTicket.bind(posController));
router.post('/tickets/:id/split', posController.splitTicket.bind(posController));

export const posRouter = router;
