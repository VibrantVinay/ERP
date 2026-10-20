import { Request, Response, NextFunction } from 'express';
import { tableService } from './service';
import { sendSuccess } from '../../core/response';

export class TableController {
  public getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { zone } = req.query as { zone?: string };
      const tables = tableService.getAll(zone);
      return sendSuccess(res, tables, 200, { total: tables.length });
    } catch (err) {
      next(err);
    }
  }

  public updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, party } = req.body;
      const updated = tableService.updateStatus(req.params.id, status, party);
      return sendSuccess(res, updated);
    } catch (err) {
      next(err);
    }
  }
}

export const tableController = new TableController();

