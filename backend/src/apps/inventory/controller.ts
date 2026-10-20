import { Request, Response, NextFunction } from 'express';
import { inventoryService } from './service';
import { sendSuccess } from '../../core/response';

export class InventoryController {
  public getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { status } = req.query as { status?: string };
      const items = inventoryService.getAll(status);
      return sendSuccess(res, items, 200, { total: items.length });
    } catch (err) {
      next(err);
    }
  }

  public getAlerts(req: Request, res: Response, next: NextFunction) {
    try {
      const alerts = inventoryService.getAlerts();
      return sendSuccess(res, alerts);
    } catch (err) {
      next(err);
    }
  }

  public updateStock(req: Request, res: Response, next: NextFunction) {
    try {
      const { onHand, status } = req.body;
      const updated = inventoryService.updateStock(req.params.id, onHand, status);
      return sendSuccess(res, updated);
    } catch (err) {
      next(err);
    }
  }
}

export const inventoryController = new InventoryController();

