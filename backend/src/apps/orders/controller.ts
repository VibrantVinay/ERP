import { Request, Response, NextFunction } from 'express';
import { orderService } from './service';
import { sendSuccess } from '../../core/response';

export class OrderController {
  public async getOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, type, branchId } = req.query;
      const orders = await orderService.getAll({
        status: status as string,
        type: type as string,
        branchId: branchId as string,
      });
      return sendSuccess(res, orders);
    } catch (error) {
      next(error);
    }
  }

  public async getOrderById(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await orderService.getById(req.params.id);
      return sendSuccess(res, order);
    } catch (error) {
      next(error);
    }
  }

  public async createOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await orderService.create(req.body);
      return sendSuccess(res, order, 'Order created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  public async updateOrderStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await orderService.updateStatus(req.params.id, req.body);
      return sendSuccess(res, order, `Order status updated to ${order.status}`);
    } catch (error) {
      next(error);
    }
  }

  public async cancelOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await orderService.cancelOrder(req.params.id, req.body);
      return sendSuccess(res, order, 'Order cancelled successfully');
    } catch (error) {
      next(error);
    }
  }

  public async mergeOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await orderService.mergeOrders(req.body);
      return sendSuccess(res, order, 'Orders merged successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const orderController = new OrderController();
