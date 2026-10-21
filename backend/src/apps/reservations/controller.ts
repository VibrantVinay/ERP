import { Request, Response, NextFunction } from 'express';
import { reservationService } from './service';
import { sendSuccess } from '../../core/response';

export class ReservationController {
  public async getReservations(req: Request, res: Response, next: NextFunction) {
    try {
      const { date, status, branchId } = req.query;
      const reservations = await reservationService.getAll({
        date: date as string,
        status: status as string,
        branchId: branchId as string,
      });
      return sendSuccess(res, reservations);
    } catch (error) {
      next(error);
    }
  }

  public async getReservationById(req: Request, res: Response, next: NextFunction) {
    try {
      const reservation = await reservationService.getById(req.params.id);
      return sendSuccess(res, reservation);
    } catch (error) {
      next(error);
    }
  }

  public async createReservation(req: Request, res: Response, next: NextFunction) {
    try {
      const reservation = await reservationService.create(req.body);
      return sendSuccess(res, reservation, 'Reservation booked successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  public async updateReservation(req: Request, res: Response, next: NextFunction) {
    try {
      const reservation = await reservationService.update(req.params.id, req.body);
      return sendSuccess(res, reservation, 'Reservation updated');
    } catch (error) {
      next(error);
    }
  }

  public async checkInReservation(req: Request, res: Response, next: NextFunction) {
    try {
      const reservation = await reservationService.checkIn(req.params.id);
      return sendSuccess(res, reservation, 'Guest checked in as Arrived');
    } catch (error) {
      next(error);
    }
  }
}

export const reservationController = new ReservationController();

