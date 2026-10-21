import { Request, Response, NextFunction } from 'express';
import { customerService } from './service';
import { sendSuccess } from '../../core/response';

export class CustomerController {
  public async getCustomers(req: Request, res: Response, next: NextFunction) {
    try {
      const segment = req.query.segment as string | undefined;
      const search = req.query.search as string | undefined;
      const data = await customerService.getCustomers({ segment, search });
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }

  public async getCustomerById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await customerService.getCustomerById(req.params.id);
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }

  public async createCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await customerService.createCustomer(req.body);
      return sendSuccess(res, data, 201);
    } catch (err) {
      next(err);
    }
  }

  public async updateCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await customerService.updateCustomer(req.params.id, req.body);
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }

  public async getCustomerHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await customerService.getCustomerHistory(req.params.id);
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }
}

export const customerController = new CustomerController();
