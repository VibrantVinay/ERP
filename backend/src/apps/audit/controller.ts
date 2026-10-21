import { Request, Response } from 'express';
import { auditService } from './service';
import { sendSuccess, sendError } from '../../core/response';

export class AuditController {
  public async getLogs(req: Request, res: Response): Promise<void> {
    try {
      const { module, action, severity, actorId, branchId, limit } = req.query as any;
      const logs = await auditService.getLogs({
        module,
        action,
        severity,
        actorId,
        branchId,
        limit: limit ? Number(limit) : undefined,
      });
      sendSuccess(res, logs);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to fetch audit logs', 500);
    }
  }

  public async getLogById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const log = await auditService.getById(id);
      if (!log) {
        sendError(res, `Audit log with id ${id} not found`, 404);
        return;
      }
      sendSuccess(res, log);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to fetch audit log', 500);
    }
  }

  public async createLog(req: Request, res: Response): Promise<void> {
    try {
      const { actorId, actorName, actorRole, branchId, module, action, description } = req.body;
      if (!actorId || !actorName || !actorRole || !branchId || !module || !action || !description) {
        sendError(res, 'Missing required audit event fields', 400);
        return;
      }

      const log = await auditService.createLog(req.body);
      sendSuccess(res, log, 201);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to record audit event', 500);
    }
  }

  public async getSummary(req: Request, res: Response): Promise<void> {
    try {
      const summary = await auditService.getSummary();
      sendSuccess(res, summary);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to fetch audit summary', 500);
    }
  }
}

export const auditController = new AuditController();

