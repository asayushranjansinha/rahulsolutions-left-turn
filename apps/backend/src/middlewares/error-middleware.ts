import { NextFunction, Request, Response } from 'express';

import { config } from '@/config/env-config';
import { logger } from '@/config/logger-config';
import { AppError } from '@/utils/app-error';

/**
 * Global error handler middleware
 */
export const errorMiddleware = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let isOperational = false;

  // Handle different error types
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    isOperational = error.isOperational;
  } else if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
  } else if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  } else {
    statusCode = 500;
    message = 'Internal server error';
  }

  logger.error(`Error ${statusCode}: ${message}`, {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    ...(config.env === 'development' && { stack: error.stack }),
  });

  // Send error response
  res.status(statusCode).json({
    status: 'error',
    message,
    ...(config.env === 'development' && {
      error: error.message,
      stack: error.stack,
      isOperational,
    }),
  });
};
