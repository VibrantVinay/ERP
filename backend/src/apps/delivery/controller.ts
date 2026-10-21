import { Request, Response, NextFunction } from 'express';
import { deliveryService } from './service';
import { sendSuccess } from '../../core/response';

export class DeliveryController {
  public async getDispatches(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, driverId, branchId } = req.query;
      const dispatches = await deliveryService.getDispatches({
        status: status as string,
        driverId: driverId as string,
        branchId: branchId as string,
      });
      return sendSuccess(res, dispatches);
    } catch (error) {
      next(error);
    }
  }

  public async getDispatchById(req: Request, res: Response, next: NextFunction) {
    try {
      const dispatch = await deliveryService.getDispatchById(req.params.id);
      return sendSuccess(res, dispatch);
    } catch (error) {
      next(error);
    }
  }

  public async createDispatch(req: Request, res: Response, next: NextFunction) {
    try {
      const dispatch = await deliveryService.createDispatch(req.body);
      return sendSuccess(res, dispatch, 'Delivery dispatch created', 201);
    } catch (error) {
      next(error);
    }
  }

  public async assignDriver(req: Request, res: Response, next: NextFunction) {
    try {
      const dispatch = await deliveryService.assignDriver(req.params.id, req.body);
      return sendSuccess(res, dispatch, `Assigned to driver ${dispatch.driverName}`);
    } catch (error) {
      next(error);
    }
  }

  public async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const dispatch = await deliveryService.updateStatus(req.params.id, req.body.status);
      return sendSuccess(res, dispatch, `Dispatch status updated to ${dispatch.status}`);
    } catch (error) {
      next(error);
    }
  }

  public async getDrivers(req: Request, res: Response, next: NextFunction) {
    try {
      const drivers = await deliveryService.getDrivers();
      return sendSuccess(res, drivers);
    } catch (error) {
      next(error);
    }
  }

  public async updateDriverStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const driver = await deliveryService.updateDriverStatus(req.params.id, req.body.status);
      return sendSuccess(res, driver, `Driver status updated to ${driver.status}`);
    } catch (error) {
      next(error);
    }
  }

  public async getZones(req: Request, res: Response, next: NextFunction) {
    try {
      const zones = await deliveryService.getZones();
      return sendSuccess(res, zones);
    } catch (error) {
      next(error);
    }
  }
}

export const deliveryController = new DeliveryController();

