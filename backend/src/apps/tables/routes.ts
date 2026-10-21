import { Router } from 'express';
import { tableController } from './controller';

const router = Router();

router.get('/', (req, res, next) => tableController.getTables(req, res, next));
router.get('/zones', (req, res, next) => tableController.getZones(req, res, next));
router.get('/waitlist', (req, res, next) => tableController.getWaitlist(req, res, next));
router.post('/waitlist', (req, res, next) => tableController.addToWaitlist(req, res, next));
router.patch('/waitlist/:id', (req, res, next) => tableController.updateWaitlistStatus(req, res, next));
router.get('/:id', (req, res, next) => tableController.getTableById(req, res, next));
router.patch('/:id/status', (req, res, next) => tableController.updateTableStatus(req, res, next));
router.post('/:id/seat', (req, res, next) => tableController.seatTable(req, res, next));
router.post('/:id/clear', (req, res, next) => tableController.clearTable(req, res, next));

export const tableRouter = router;
