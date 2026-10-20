import { Router } from 'express';
import { posController } from './controller';

const router = Router();

router.post('/calculate', posController.calculate.bind(posController));
router.post('/tickets', posController.createTicket.bind(posController));

export const posRouter = router;

