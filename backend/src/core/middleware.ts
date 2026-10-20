import { Request, Response, NextFunction } from 'express';
import { AppError } from './errors';
import { sendError } from './response';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    restaurantId: string;
    branchId?: string;
  };
}

export function tenantContextMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // Extract or default tenant headers for dev/production flexibility
  const restaurantId = (req.headers['x-restaurant-id'] as string) || 'default-restaurant';
  const branchId = (req.headers['x-branch-id'] as string) || 'panaji-main';

  req.user = {
    id: 'usr_owner_01',
    email: 'admin@rift.example',
    role: 'owner',
    restaurantId,
    branchId,
  };

  next();
}

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[HTTP] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });
  next();
}

export function globalErrorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode, err.code, err.details);
  }

  console.error('[Unhandled Error]', err);
  return sendError(res, 'Internal Server Error', 500, 'INTERNAL_SERVER_ERROR');
}

