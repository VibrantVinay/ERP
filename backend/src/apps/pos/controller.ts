import { Request, Response, NextFunction } from 'express';
import { posService } from './service';
import { sendSuccess } from '../../core/response';
import { AuthenticatedRequest } from '../../core/middleware';

export class PosController {
  public calculate(req: Request, res: Response, next: NextFunction) {
    try {
      const { items, discountPercentage } = req.body;
      const result = posService.calculate({ items: items || [], discountPercentage });
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  public async createTicket(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const serverName = req.user?.email ? req.user.email.split('@')[0] : 'Staff';
      const branchId = req.user?.branchId || 'Panaji Main';
      const ticket = await posService.createTicket(req.body, serverName, branchId);
      return sendSuccess(res, ticket, 201);
    } catch (err) {
      next(err);
    }
  }

  public async getActiveTickets(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const branchId = req.user?.branchId;
      const tickets = await posService.getActiveTickets(branchId);
      return sendSuccess(res, tickets, 200, { total: tickets.length });
    } catch (err) {
      next(err);
    }
  }

  public async getTicketById(req: Request, res: Response, next: NextFunction) {
    try {
      const ticket = await posService.getTicketById(req.params.id);
      return sendSuccess(res, ticket);
    } catch (err) {
      next(err);
    }
  }

  public async payTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const { paymentMethod, amountPaid, notes } = req.body;
      const updated = await posService.payTicket(req.params.id, {
        paymentMethod,
        amountPaid: Number(amountPaid),
        notes,
      });
      return sendSuccess(res, updated);
    } catch (err) {
      next(err);
    }
  }

  public async splitTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const { parts, paymentMethod } = req.body;
      const subTickets = await posService.splitTicket(req.params.id, {
        parts: Number(parts) || 2,
        paymentMethod,
      });
      return sendSuccess(res, subTickets, 201);
    } catch (err) {
      next(err);
    }
  }
}

export const posController = new PosController();
