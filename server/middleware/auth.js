/**
 * JWT Authentication Middleware
 *
 * Extracts the Bearer token from the Authorization header,
 * verifies it, and attaches the user to req.user.
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // Check for Bearer token in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // No token found
  if (!token) {
    const error = new Error('Not authorized — no token provided');
    error.statusCode = 401;
    throw error;
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user to request (exclude password)
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      const error = new Error('Not authorized — user no longer exists');
      error.statusCode = 401;
      throw error;
    }

    next();
  } catch (err) {
    // If it's already a custom error, re-throw
    if (err.statusCode) {
      throw err;
    }
    // JWT verification failed
    const error = new Error('Not authorized — invalid token');
    error.statusCode = 401;
    error.name = err.name; // Preserve JsonWebTokenError / TokenExpiredError
    throw error;
  }
};

module.exports = protect;
