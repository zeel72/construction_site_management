/**
 * Centralized Error Handler Middleware
 *
 * Catches all errors thrown in routes/middleware and returns
 * a consistent JSON response format:
 * { success: false, error: "message", statusCode: 4xx/5xx }
 */

const errorHandler = (err, req, res, next) => {
  // Clone error properties
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // ---- Mongoose Errors ----

  // Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Validation Error (missing required fields, enum mismatch, etc.)
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const messages = Object.values(err.errors).map((val) => val.message);
    message = messages.join('. ');
  }

  // Duplicate Key Error (code 11000)
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate value for field: ${field}. Please use a different value.`;
  }

  // ---- JWT Errors ----

  // Invalid token
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please log in again.';
  }

  // Expired token
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired. Please log in again.';
  }

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Error:', {
      message: err.message,
      stack: err.stack,
      statusCode,
    });
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    statusCode,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
