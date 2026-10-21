import { Request, Response, NextFunction } from 'express';
import { stockMovementService } from './service';
import { sendSuccess } from '../../core/response';

export class StockMovementController {
  public async getMovements(req: Request, res: Response, next: NextFunction) {
    try {
      const type = req.query.type as string | undefined;
      const data = await stockMovementService.getMovements({ type });
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }

  public async getVarianceSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await stockMovementService.getVarianceSummary();
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }

  public async getMovementById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await stockMovementService.getMovementById(req.params.id);
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }

  public async createMovement(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await stockMovementService.createMovement(req.body);
      return sendSuccess(res, data, 201);
    } catch (err) {
      next(err);
    }
  }
}

export const stockMovementController = new StockMovementController();
