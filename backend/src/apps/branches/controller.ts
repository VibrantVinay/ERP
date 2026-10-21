import { Request, Response } from 'express';
import { branchService } from './service';
import { sendSuccess, sendError } from '../../core/response';

export class BranchController {
  public async getBranches(req: Request, res: Response): Promise<void> {
    try {
      const status = req.query.status as string | undefined;
      const branches = await branchService.getAll(status);
      sendSuccess(res, branches);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to fetch branches', 500);
    }
  }

  public async getBranchById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const branch = await branchService.getById(id);
      if (!branch) {
        sendError(res, `Branch with id ${id} not found`, 404);
        return;
      }
      sendSuccess(res, branch);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to fetch branch', 500);
    }
  }

  public async createBranch(req: Request, res: Response): Promise<void> {
    try {
      const { code, name, city, address, phone, email, managerName } = req.body;
      if (!code || !name || !city || !address || !phone || !email || !managerName) {
        sendError(res, 'Missing required branch fields (code, name, city, address, phone, email, managerName)', 400);
        return;
      }

      const branch = await branchService.create(req.body);
      sendSuccess(res, branch, 201);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to create branch', 500);
    }
  }

  public async updateBranch(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const branch = await branchService.update(id, req.body);
      if (!branch) {
        sendError(res, `Branch with id ${id} not found`, 404);
        return;
      }
      sendSuccess(res, branch);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to update branch', 500);
    }
  }

  public async deleteBranch(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await branchService.delete(id);
      if (!deleted) {
        sendError(res, `Branch with id ${id} not found`, 404);
        return;
      }
      sendSuccess(res, { message: 'Branch deleted successfully' });
    } catch (error: any) {
      sendError(res, error.message || 'Failed to delete branch', 500);
    }
  }

  public async getSummary(req: Request, res: Response): Promise<void> {
    try {
      const summary = await branchService.getSummary();
      sendSuccess(res, summary);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to fetch branch summary', 500);
    }
  }
}

export const branchController = new BranchController();

