import { Request, Response, NextFunction } from 'express';
import { staffService } from './service';
import { sendSuccess } from '../../core/response';

export class StaffController {
  public async getStaff(req: Request, res: Response, next: NextFunction) {
    try {
      const role = req.query.role as string | undefined;
      const data = await staffService.getStaff(role);
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }

  public async createStaff(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await staffService.createStaff(req.body);
      return sendSuccess(res, data, 201);
    } catch (err) {
      next(err);
    }
  }

  public async getShifts(req: Request, res: Response, next: NextFunction) {
    try {
      const date = req.query.date as string | undefined;
      const data = await staffService.getShifts(date);
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }

  public async createShift(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await staffService.createShift(req.body);
      return sendSuccess(res, data, 201);
    } catch (err) {
      next(err);
    }
  }

  public async getAttendance(req: Request, res: Response, next: NextFunction) {
    try {
      const date = req.query.date as string | undefined;
      const data = await staffService.getAttendance(date);
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }

  public async clockPunch(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await staffService.clockPunch(req.body);
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }

  public async getPayrollSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await staffService.getPayrollSummary();
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }
}

export const staffController = new StaffController();

