import { Request, Response, NextFunction } from 'express';
import { inventoryService } from './service';
import { sendSuccess } from '../../core/response';

export class InventoryController {
  public async getItems(req: Request, res: Response, next: NextFunction) {
    try {
      const { location, status, branchId } = req.query;
      const items = await inventoryService.getItems({
        location: location as string,
        status: status as string,
        branchId: branchId as string,
      });
      return sendSuccess(res, items);
    } catch (error) {
      next(error);
    }
  }

  public async getItemById(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await inventoryService.getItemById(req.params.id);
      return sendSuccess(res, item);
    } catch (error) {
      next(error);
    }
  }

  public async createItem(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await inventoryService.createItem(req.body);
      return sendSuccess(res, item, 'Inventory item registered', 201);
    } catch (error) {
      next(error);
    }
  }

  public async addBatch(req: Request, res: Response, next: NextFunction) {
    try {
      const batch = await inventoryService.addBatch(req.body);
      return sendSuccess(res, batch, 'Batch logged & stock updated', 201);
    } catch (error) {
      next(error);
    }
  }

  public async adjustStock(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await inventoryService.adjustStock(req.params.id, req.body);
      return sendSuccess(res, item, 'Stock count adjusted');
    } catch (error) {
      next(error);
    }
  }

  public async getAlerts(req: Request, res: Response, next: NextFunction) {
    try {
      const alerts = await inventoryService.getAlerts();
      return sendSuccess(res, alerts);
    } catch (error) {
      next(error);
    }
  }

  public async getLocations(req: Request, res: Response, next: NextFunction) {
    try {
      const locations = await inventoryService.getLocations();
      return sendSuccess(res, locations);
    } catch (error) {
      next(error);
    }
  }
}

export const inventoryController = new InventoryController();
