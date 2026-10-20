export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details: any;

  constructor(message: string, statusCode = 500, code = 'INTERNAL_ERROR', details: any = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', details: any = null) {
    super(message, 404, 'NOT_FOUND', details);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details: any = null) {
    super(message, 422, 'VALIDATION_FAILED', details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', details: any = null) {
    super(message, 401, 'UNAUTHORIZED', details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden action', details: any = null) {
    super(message, 403, 'FORBIDDEN', details);
  }
}

