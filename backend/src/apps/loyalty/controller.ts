import { Request, Response, NextFunction } from 'express';
import { loyaltyService } from './service';
import { sendSuccess } from '../../core/response';

export class LoyaltyController {
  public async getCampaigns(req: Request, res: Response, next: NextFunction) {
    try {
      const activeOnly = req.query.active === 'true';
      const data = await loyaltyService.getCampaigns(activeOnly);
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }

  public async createCampaign(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await loyaltyService.createCampaign(req.body);
      return sendSuccess(res, data, 201);
    } catch (err) {
      next(err);
    }
  }

  public async validateCoupon(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await loyaltyService.validateCoupon(req.body);
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }

  public async getMembers(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await loyaltyService.getMembers();
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }

  public async getMemberById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await loyaltyService.getMemberById(req.params.id);
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }

  public async adjustPoints(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await loyaltyService.adjustPoints(req.params.id, req.body);
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }
}

export const loyaltyController = new LoyaltyController();
