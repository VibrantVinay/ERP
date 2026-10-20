import { Request, Response, NextFunction } from 'express';
import { orderService } from './service';
import { sendSuccess } from '../../core/response';

export class OrderController {
  public getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, type } = req.query as { status?: string; type?: string };
      const orders = orderService.getAll({ status, type });
      return sendSuccess(res, orders, 200, { total: orders.length });
    } catch (err) {
      next(err);
    }
  }

  public getById(req: Request, res: Response, next: NextFunction) {
    try {
      const order = orderService.getById(req.params.id);
      return sendSuccess(res, order);
    } catch (err) {
      next(err);
    }
  }

  public updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { status } = req.body;
      const updated = orderService.updateStatus(req.params.id, status);
      return sendSuccess(res, updated);
    } catch (err) {
      next(err);
    }
  }

  public create(req: Request, res: Response, next: NextFunction) {
    try {
      const created = orderService.create(req.body);
      return sendSuccess(res, created, 201);
    } catch (err) {
      next(err);
    }
  }
}

export const orderController = new OrderController();

