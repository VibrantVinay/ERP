import { Router } from 'express';
import { equipmentController } from './controller';

const router = Router();

router.get('/', (req, res) => equipmentController.getEquipment(req, res));
router.post('/', (req, res) => equipmentController.createEquipment(req, res));
router.patch('/:id/status', (req, res) => equipmentController.updateStatus(req, res));
router.post('/:id/maintenance', (req, res) => equipmentController.logMaintenance(req, res));

// Breakdown tickets
router.get('/breakdowns', (req, res) => equipmentController.getBreakdownTickets(req, res));
router.post('/breakdowns', (req, res) => equipmentController.createBreakdownTicket(req, res));
router.patch('/breakdowns/:id/resolve', (req, res) => equipmentController.resolveTicket(req, res));

export default router;

