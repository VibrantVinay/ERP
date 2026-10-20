import { Request, Response, NextFunction } from 'express';
import { AppError } from './errors';
import { sendError } from './response';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    restaurantId: string;
    branchId: string;
  };
}

export function tenantContextMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  let userId = 'usr_owner_01';
  let email = 'aarav@rift.example';
  let role = 'owner';
  let restaurantId = (req.headers['x-restaurant-id'] as string) || 'rest_01';
  let branchId = (req.headers['x-branch-id'] as string) || 'Panaji Main';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const rawToken = authHeader.substring(7);
    try {
      const decoded = JSON.parse(Buffer.from(rawToken, 'base64').toString('utf8'));
      if (decoded.sub) userId = decoded.sub;
      if (decoded.email) email = decoded.email;
      if (decoded.role) role = decoded.role;
      if (decoded.restaurantId) restaurantId = decoded.restaurantId;
      if (decoded.activeBranch) branchId = decoded.activeBranch;
    } catch {
      // invalid token will use defaults or trigger unauthorized in guard
    }
  }

  req.user = {
    id: userId,
    email,
    role,
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
