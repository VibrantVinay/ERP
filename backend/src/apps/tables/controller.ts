import { Request, Response, NextFunction } from 'express';
import { tableService } from './service';
import { sendSuccess } from '../../core/response';

export class TableController {
  public async getTables(req: Request, res: Response, next: NextFunction) {
    try {
      const { zone, status, branchId } = req.query;
      const tables = await tableService.getTables({
        zone: zone as string,
        status: status as string,
        branchId: branchId as string,
      });
      return sendSuccess(res, tables);
    } catch (error) {
      next(error);
    }
  }

  public async getTableById(req: Request, res: Response, next: NextFunction) {
    try {
      const table = await tableService.getTableById(req.params.id);
      return sendSuccess(res, table);
    } catch (error) {
      next(error);
    }
  }

  public async updateTableStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const table = await tableService.updateTableStatus(req.params.id, req.body.status);
      return sendSuccess(res, table, `Table status changed to ${table.status}`);
    } catch (error) {
      next(error);
    }
  }

  public async seatTable(req: Request, res: Response, next: NextFunction) {
    try {
      const table = await tableService.seatTable(req.params.id, req.body);
      return sendSuccess(res, table, `Guests seated at ${table.name}`);
    } catch (error) {
      next(error);
    }
  }

  public async clearTable(req: Request, res: Response, next: NextFunction) {
    try {
      const table = await tableService.clearTable(req.params.id);
      return sendSuccess(res, table, `${table.name} cleared and available`);
    } catch (error) {
      next(error);
    }
  }

  public async getZones(req: Request, res: Response, next: NextFunction) {
    try {
      const zones = await tableService.getZones();
      return sendSuccess(res, zones);
    } catch (error) {
      next(error);
    }
  }

  public async getWaitlist(req: Request, res: Response, next: NextFunction) {
    try {
      const list = await tableService.getWaitlist();
      return sendSuccess(res, list);
    } catch (error) {
      next(error);
    }
  }

  public async addToWaitlist(req: Request, res: Response, next: NextFunction) {
    try {
      const entry = await tableService.addToWaitlist(req.body);
      return sendSuccess(res, entry, 'Guest added to waitlist', 201);
    } catch (error) {
      next(error);
    }
  }

  public async updateWaitlistStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      await tableService.updateWaitlistStatus(id, status);
      return sendSuccess(res, null, `Waitlist status updated to ${status}`);
    } catch (error) {
      next(error);
    }
  }
}

export const tableController = new TableController();
