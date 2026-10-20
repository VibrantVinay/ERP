import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  data: T | null;
  meta?: Record<string, any>;
  error?: {
    code: string;
    message: string;
    details?: any;
  } | null;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  meta?: Record<string, any>
): Response {
  const body: ApiResponse<T> = {
    success: true,
    data,
    meta,
    error: null,
  };
  return res.status(statusCode).json(body);
}

export function sendError(
  res: Response,
  message: string,
  statusCode = 500,
  code = 'ERROR',
  details?: any
): Response {
  const body: ApiResponse = {
    success: false,
    data: null,
    error: {
      code,
      message,
      details,
    },
  };
  return res.status(statusCode).json(body);
}

