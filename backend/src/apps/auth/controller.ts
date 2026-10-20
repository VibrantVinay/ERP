import { Request, Response, NextFunction } from 'express';
import { authService } from './service';
import { sendSuccess } from '../../core/response';
import { AuthenticatedRequest } from '../../core/middleware';

export class AuthController {
  public async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, branchId } = req.body;
      const result = await authService.loginWithPassword({ email, password, branchId });
      return sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  }

  public async pinLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const { pin, branchId } = req.body;
      const result = await authService.loginWithPin({ pin, branchId });
      return sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  }

  public async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'usr_owner_01';
      const profile = await authService.getProfile(userId);
      return sendSuccess(res, profile);
    } catch (err) {
      next(err);
    }
  }

  public async switchBranch(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'usr_owner_01';
      const { branchId } = req.body;
      const updated = await authService.switchBranch(userId, branchId);
      return sendSuccess(res, updated);
    } catch (err) {
      next(err);
    }
  }

  public getDemoPersonas(req: Request, res: Response, next: NextFunction) {
    try {
      const personas = authService.getDemoPersonas();
      return sendSuccess(res, personas);
    } catch (err) {
      next(err);
    }
  }

  public logout(req: Request, res: Response, next: NextFunction) {
    try {
      return sendSuccess(res, { message: 'Logged out successfully' });
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
