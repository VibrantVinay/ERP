import { Request, Response, NextFunction } from 'express';
import { menuService } from './service';
import { sendSuccess } from '../../core/response';

export class MenuController {
  public getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { category } = req.query as { category?: string };
      const items = menuService.getAll(category);
      return sendSuccess(res, items, 200, { total: items.length });
    } catch (err) {
      next(err);
    }
  }

  public setAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      const { availability } = req.body;
      const updated = menuService.setAvailability(req.params.id, availability);
      return sendSuccess(res, updated);
    } catch (err) {
      next(err);
    }
  }
}

export const menuController = new MenuController();

