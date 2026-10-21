import { Request, Response } from 'express';
import { equipmentService } from './service';

export class EquipmentController {
  public async getEquipment(req: Request, res: Response): Promise<void> {
    try {
      const { branchId, category, status } = req.query;
      const data = await equipmentService.getEquipment(
        branchId as string | undefined,
        category as string | undefined,
        status as string | undefined
      );
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public async createEquipment(req: Request, res: Response): Promise<void> {
    try {
      const { branchId, name, category, serialNumber, location, serviceIntervalDays, purchaseDate, technicianContact, notes } = req.body;
      if (!name || !category || !location) {
        res.status(400).json({ success: false, error: 'Name, category, and location are required' });
        return;
      }
      const data = await equipmentService.createEquipment({
        branchId,
        name,
        category,
        serialNumber,
        location,
        serviceIntervalDays: serviceIntervalDays ? Number(serviceIntervalDays) : undefined,
        purchaseDate,
        technicianContact,
        notes,
      });
      res.status(201).json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (!status) {
        res.status(400).json({ success: false, error: 'Status is required' });
        return;
      }
      const data = await equipmentService.updateStatus(id, status);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public async logMaintenance(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { serviceDate, technicianName, cost, notes } = req.body;
      if (!technicianName) {
        res.status(400).json({ success: false, error: 'technicianName is required' });
        return;
      }
      const data = await equipmentService.logMaintenance(id, {
        serviceDate,
        technicianName,
        cost: cost ? Number(cost) : undefined,
        notes,
      });
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public async getBreakdownTickets(req: Request, res: Response): Promise<void> {
    try {
      const { branchId, status } = req.query;
      const data = await equipmentService.getBreakdownTickets(
        branchId as string | undefined,
        status as string | undefined
      );
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public async createBreakdownTicket(req: Request, res: Response): Promise<void> {
    try {
      const { branchId, equipmentId, reportedBy, issueDescription, priority } = req.body;
      if (!equipmentId || !reportedBy || !issueDescription) {
        res.status(400).json({ success: false, error: 'equipmentId, reportedBy, and issueDescription are required' });
        return;
      }
      const data = await equipmentService.createBreakdownTicket({
        branchId,
        equipmentId,
        reportedBy,
        issueDescription,
        priority,
      });
      res.status(201).json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public async resolveTicket(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { technicianName, serviceCost, partsReplaced, notes } = req.body;
      if (!technicianName) {
        res.status(400).json({ success: false, error: 'technicianName is required' });
        return;
      }
      const data = await equipmentService.resolveTicket(id, {
        technicianName,
        serviceCost: serviceCost ? Number(serviceCost) : undefined,
        partsReplaced,
        notes,
      });
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

export const equipmentController = new EquipmentController();

