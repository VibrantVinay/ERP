import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  data: T | null;
  message?: string;
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
  statusOrMessage: number | string = 200,
  statusCodeOrMeta: number | Record<string, any> = 200,
  meta?: Record<string, any>
): Response {
  let statusCode = 200;
  let message: string | undefined = undefined;
  let resolvedMeta: Record<string, any> | undefined = undefined;

  if (typeof statusOrMessage === 'number') {
    statusCode = statusOrMessage;
    if (typeof statusCodeOrMeta === 'object') {
      resolvedMeta = statusCodeOrMeta;
    }
  } else if (typeof statusOrMessage === 'string') {
    message = statusOrMessage;
    if (typeof statusCodeOrMeta === 'number') {
      statusCode = statusCodeOrMeta;
      resolvedMeta = meta;
    } else if (typeof statusCodeOrMeta === 'object') {
      resolvedMeta = statusCodeOrMeta;
    }
  }

  const body: ApiResponse<T> = {
    success: true,
    data,
    message,
    meta: resolvedMeta,
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
