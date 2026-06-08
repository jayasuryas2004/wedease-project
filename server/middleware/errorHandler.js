/**
 * Centralized Error Handling
 * Custom error classes and error handler middleware
 */

/**
 * Base API Error class
 */
class APIError extends Error {
  constructor(message, statusCode = 500, errorCode = 'INTERNAL_ERROR') {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Not Found Error (404)
 */
class NotFoundError extends APIError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

/**
 * Validation Error (400)
 */
class ValidationError extends APIError {
  constructor(message = 'Validation failed', errors = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

/**
 * Authentication Error (401)
 */
class AuthenticationError extends APIError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization Error (403)
 */
class AuthorizationError extends APIError {
  constructor(message = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

/**
 * Duplicate Resource Error (409)
 */
class DuplicateError extends APIError {
  constructor(message = 'Resource already exists') {
    super(message, 409, 'DUPLICATE_ERROR');
    this.name = 'DuplicateError';
  }
}

/**
 * Rate Limit Error (429)
 */
class RateLimitError extends APIError {
  constructor(message = 'Too many requests', retryAfter = 60) {
    super(message, 429, 'RATE_LIMIT_ERROR');
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

/**
 * Database Error (500)
 */
class DatabaseError extends APIError {
  constructor(message = 'Database operation failed') {
    super(message, 500, 'DATABASE_ERROR');
    this.name = 'DatabaseError';
  }
}

/**
 * Payment Error (402)
 */
class PaymentError extends APIError {
  constructor(message = 'Payment failed') {
    super(message, 402, 'PAYMENT_ERROR');
    this.name = 'PaymentError';
  }
}

/**
 * External Service Error (502)
 */
class ExternalServiceError extends APIError {
  constructor(message = 'External service unavailable') {
    super(message, 502, 'EXTERNAL_SERVICE_ERROR');
    this.name = 'ExternalServiceError';
  }
}

/**
 * Handle Mongoose CastError (invalid ObjectId)
 */
const handleCastError = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new ValidationError(message);
};

/**
 * Handle Mongoose Duplicate Key Error
 */
const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const message = `${field} already exists`;
  return new DuplicateError(message);
};

/**
 * Handle Mongoose Validation Error
 */
const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map(el => ({
    field: el.path,
    message: el.message
  }));
  return new ValidationError('Validation failed', errors);
};

/**
 * Handle JWT Errors
 */
const handleJWTError = () => {
  return new AuthenticationError('Invalid token. Please log in again.');
};

const handleJWTExpiredError = () => {
  return new AuthenticationError('Your token has expired. Please log in again.');
};

/**
 * Development Error Response
 */
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    error: err,
    message: err.message,
    errorCode: err.errorCode,
    stack: err.stack
  });
};

/**
 * Production Error Response
 */
const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errorCode: err.errorCode,
      ...(err.errors && { errors: err.errors }),
      ...(err.retryAfter && { retryAfter: err.retryAfter })
    });
  } else {
    // Programming or other unknown error: don't leak error details
    console.error('ERROR 💥:', err);
    
    res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again later.',
      errorCode: 'INTERNAL_ERROR'
    });
  }
};

/**
 * Global Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.errorCode = err.errorCode || 'INTERNAL_ERROR';

  // Log error
  console.error(`[${new Date().toISOString()}] Error:`, {
    message: err.message,
    errorCode: err.errorCode,
    statusCode: err.statusCode,
    path: req.path,
    method: req.method,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });

  if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;

    // Handle specific error types
    if (err.name === 'CastError') error = handleCastError(err);
    if (err.code === 11000) error = handleDuplicateKeyError(err);
    if (err.name === 'ValidationError') error = handleValidationError(err);
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, res);
  } else {
    sendErrorDev(err, res);
  }
};

/**
 * Async Handler - Wrap async functions to catch errors
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Not Found Handler - 404 for unmatched routes
 */
const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  next(error);
};

module.exports = {
  APIError,
  NotFoundError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  DuplicateError,
  RateLimitError,
  DatabaseError,
  PaymentError,
  ExternalServiceError,
  errorHandler,
  asyncHandler,
  notFoundHandler
};
