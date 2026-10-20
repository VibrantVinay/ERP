import { Request, Response, NextFunction } from 'express';
import { kitchenService } from './service';
import { sendSuccess } from '../../core/response';

export class KitchenController {
  public getTickets(req: Request, res: Response, next: NextFunction) {
    try {
      const { station } = req.query as { station?: string };
      const tickets = kitchenService.getTickets(station);
      return sendSuccess(res, tickets, 200, { total: tickets.length });
    } catch (err) {
      next(err);
    }
  }

  public updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { status } = req.body;
      const updated = kitchenService.updateStatus(req.params.id, status);
      return sendSuccess(res, updated);
    } catch (err) {
      next(err);
    }
  }

  public addTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const created = kitchenService.addTicket(req.body);
      return sendSuccess(res, created, 201);
    } catch (err) {
      next(err);
    }
  }
}

export const kitchenController = new KitchenController();

