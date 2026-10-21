import { Router } from 'express';
import { reservationController } from './controller';

const router = Router();

router.get('/', (req, res, next) => reservationController.getReservations(req, res, next));
router.post('/', (req, res, next) => reservationController.createReservation(req, res, next));
router.get('/:id', (req, res, next) => reservationController.getReservationById(req, res, next));
router.patch('/:id', (req, res, next) => reservationController.updateReservation(req, res, next));
router.post('/:id/check-in', (req, res, next) => reservationController.checkInReservation(req, res, next));

export const reservationRouter = router;

