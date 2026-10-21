import { Request, Response, NextFunction } from 'express';
import { menuService } from './service';
import { sendSuccess } from '../../core/response';

export class MenuController {
  public async getItems(req: Request, res: Response, next: NextFunction) {
    try {
      const { category, availability, branchId } = req.query;
      const items = await menuService.getItems({
        category: category as string,
        availability: availability as string,
        branchId: branchId as string,
      });
      return sendSuccess(res, items);
    } catch (error) {
      next(error);
    }
  }

  public async getItemById(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await menuService.getItemById(req.params.id);
      return sendSuccess(res, item);
    } catch (error) {
      next(error);
    }
  }

  public async createItem(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await menuService.create(req.body);
      return sendSuccess(res, item, 'Menu dish created', 201);
    } catch (error) {
      next(error);
    }
  }

  public async updateItem(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await menuService.update(req.params.id, req.body);
      return sendSuccess(res, item, 'Menu item updated');
    } catch (error) {
      next(error);
    }
  }

  public async updateAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await menuService.updateAvailability(req.params.id, req.body.availability);
      return sendSuccess(res, item, `Availability set to ${item.availability}`);
    } catch (error) {
      next(error);
    }
  }

  public async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await menuService.getCategories();
      return sendSuccess(res, categories);
    } catch (error) {
      next(error);
    }
  }
}

export const menuController = new MenuController();
