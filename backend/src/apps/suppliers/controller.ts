import { Request, Response, NextFunction } from 'express';
import { supplierService } from './service';
import { sendSuccess } from '../../core/response';

export class SupplierController {
  public async getSuppliers(req: Request, res: Response, next: NextFunction) {
    try {
      const category = req.query.category as string | undefined;
      const data = await supplierService.getSuppliers(category);
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }

  public async getSupplierById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await supplierService.getSupplierById(req.params.id);
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }

  public async createSupplier(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await supplierService.createSupplier(req.body);
      return sendSuccess(res, data, 201);
    } catch (err) {
      next(err);
    }
  }

  public async getPurchaseOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const status = req.query.status as string | undefined;
      const data = await supplierService.getPurchaseOrders(status);
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }

  public async getPOById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await supplierService.getPOById(req.params.id);
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }

  public async createPurchaseOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await supplierService.createPurchaseOrder(req.body);
      return sendSuccess(res, data, 201);
    } catch (err) {
      next(err);
    }
  }

  public async updatePOStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await supplierService.updatePOStatus(req.params.id, req.body);
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }
}

export const supplierController = new SupplierController();

