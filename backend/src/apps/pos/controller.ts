import { Request, Response, NextFunction } from 'express';
import { posService } from './service';
import { sendSuccess } from '../../core/response';

export class PosController {
  public calculate(req: Request, res: Response, next: NextFunction) {
    try {
      const { items, discountPercentage } = req.body;
      const result = posService.calculate({ items: items || [], discountPercentage });
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  public createTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const ticket = posService.createTicket(req.body);
      return sendSuccess(res, ticket, 201);
    } catch (err) {
      next(err);
    }
  }
}

export const posController = new PosController();

