import { Request, Response } from 'express';
import { tasksService } from './service';

export class TasksController {
  public async getTasks(req: Request, res: Response): Promise<void> {
    try {
      const { branchId, category, status } = req.query;
      const tasks = await tasksService.getTasks(
        branchId as string | undefined,
        category as string | undefined,
        status as string | undefined
      );
      res.json({ success: true, data: tasks });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public async createTask(req: Request, res: Response): Promise<void> {
    try {
      const { branchId, category, title, description, assignedRole, assignedStaffName, priority, dueDate } = req.body;
      if (!category || !title) {
        res.status(400).json({ success: false, error: 'Category and title are required' });
        return;
      }
      const task = await tasksService.createTask({
        branchId,
        category,
        title,
        description,
        assignedRole,
        assignedStaffName,
        priority,
        dueDate,
      });
      res.status(201).json({ success: true, data: task });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public async completeTask(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { completedBy, notes, status } = req.body;
      if (!completedBy) {
        res.status(400).json({ success: false, error: 'completedBy signature is required' });
        return;
      }
      const task = await tasksService.completeTask(id, { completedBy, notes, status });
      res.json({ success: true, data: task });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public async logTemperature(req: Request, res: Response): Promise<void> {
    try {
      const { branchId, unitName, recordedTemp, unit, targetMinTemp, targetMaxTemp, recordedBy, notes } = req.body;
      if (!unitName || recordedTemp === undefined || !recordedBy) {
        res.status(400).json({ success: false, error: 'unitName, recordedTemp, and recordedBy are required' });
        return;
      }
      const log = await tasksService.logTemperature({
        branchId,
        unitName,
        recordedTemp: Number(recordedTemp),
        unit,
        targetMinTemp: targetMinTemp !== undefined ? Number(targetMinTemp) : undefined,
        targetMaxTemp: targetMaxTemp !== undefined ? Number(targetMaxTemp) : undefined,
        recordedBy,
        notes,
      });
      res.status(201).json({ success: true, data: log });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public async getTemperatureLogs(req: Request, res: Response): Promise<void> {
    try {
      const { branchId } = req.query;
      const logs = await tasksService.getTemperatureLogs(branchId as string | undefined);
      res.json({ success: true, data: logs });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

export const tasksController = new TasksController();
