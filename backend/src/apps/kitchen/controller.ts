import { Request, Response, NextFunction } from 'express';
import { kitchenService } from './service';
import { sendSuccess } from '../../core/response';

export class KitchenController {
  public async getTickets(req: Request, res: Response, next: NextFunction) {
    try {
      const { station, activeOnly, branchId } = req.query;
      const tickets = await kitchenService.getTickets({
        station: station as string,
        activeOnly: activeOnly === 'true',
        branchId: branchId as string,
      });
      return sendSuccess(res, tickets);
    } catch (error) {
      next(error);
    }
  }

  public async getTicketById(req: Request, res: Response, next: NextFunction) {
    try {
      const ticket = await kitchenService.getTicketById(req.params.id);
      return sendSuccess(res, ticket);
    } catch (error) {
      next(error);
    }
  }

  public async createTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const ticket = await kitchenService.createTicket(req.body);
      return sendSuccess(res, ticket, 'Kitchen ticket dispatched', 201);
    } catch (error) {
      next(error);
    }
  }

  public async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const ticket = await kitchenService.updateStatus(req.params.id, req.body.status);
      return sendSuccess(res, ticket, `Ticket marked as ${ticket.status}`);
    } catch (error) {
      next(error);
    }
  }

  public async bumpItem(req: Request, res: Response, next: NextFunction) {
    try {
      const { id, itemId } = req.params;
      const ticket = await kitchenService.bumpItem(id, itemId);
      return sendSuccess(res, ticket, 'Item bump status toggled');
    } catch (error) {
      next(error);
    }
  }

  public async getStations(req: Request, res: Response, next: NextFunction) {
    try {
      const stations = await kitchenService.getStations();
      return sendSuccess(res, stations);
    } catch (error) {
      next(error);
    }
  }
}

export const kitchenController = new KitchenController();
