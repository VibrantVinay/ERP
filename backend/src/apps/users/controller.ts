import { Request, Response } from 'express';
import { userService } from './service';
import { sendSuccess, sendError } from '../../core/response';

export class UserController {
  public async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const { role, status, branchId } = req.query as { role?: string; status?: string; branchId?: string };
      const users = await userService.getAll({ role, status, branchId });
      sendSuccess(res, users);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to fetch users', 500);
    }
  }

  public async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = await userService.getById(id);
      if (!user) {
        sendError(res, `User with id ${id} not found`, 404);
        return;
      }
      sendSuccess(res, user);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to fetch user', 500);
    }
  }

  public async createUser(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, phone, role, branchId } = req.body;
      if (!name || !email || !phone || !role || !branchId) {
        sendError(res, 'Missing required fields (name, email, phone, role, branchId)', 400);
        return;
      }

      const user = await userService.create(req.body);
      sendSuccess(res, user, 201);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to create user', 500);
    }
  }

  public async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = await userService.update(id, req.body);
      if (!user) {
        sendError(res, `User with id ${id} not found`, 404);
        return;
      }
      sendSuccess(res, user);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to update user', 500);
    }
  }

  public async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await userService.delete(id);
      if (!deleted) {
        sendError(res, `User with id ${id} not found`, 404);
        return;
      }
      sendSuccess(res, { message: 'User deleted successfully' });
    } catch (error: any) {
      sendError(res, error.message || 'Failed to delete user', 500);
    }
  }

  public async getSummary(req: Request, res: Response): Promise<void> {
    try {
      const summary = await userService.getSummary();
      sendSuccess(res, summary);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to fetch user summary', 500);
    }
  }
}

export const userController = new UserController();
