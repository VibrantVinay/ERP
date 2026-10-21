import { Router } from 'express';
import { kitchenController } from './controller';

const router = Router();

router.get('/tickets', (req, res, next) => kitchenController.getTickets(req, res, next));
router.get('/tickets/:id', (req, res, next) => kitchenController.getTicketById(req, res, next));
router.post('/tickets', (req, res, next) => kitchenController.createTicket(req, res, next));
router.patch('/tickets/:id/status', (req, res, next) => kitchenController.updateStatus(req, res, next));
router.patch('/tickets/:id/items/:itemId/bump', (req, res, next) => kitchenController.bumpItem(req, res, next));
router.get('/stations', (req, res, next) => kitchenController.getStations(req, res, next));

export const kitchenRouter = router;
