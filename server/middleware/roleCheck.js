/**
 * Role-Based Access Control Middleware
 *
 * Factory function that returns middleware to check if the
 * authenticated user's role is in the list of allowed roles.
 *
 * Usage:
 *   router.post('/', protect, authorize('admin', 'supervisor'), controller);
 */

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      const error = new Error('Not authorized — please log in first');
      error.statusCode = 401;
      throw error;
    }

    if (!roles.includes(req.user.role)) {
      const error = new Error(
        `Role '${req.user.role}' is not authorized to access this resource`
      );
      error.statusCode = 403;
      throw error;
    }

    next();
  };
};

module.exports = authorize;
