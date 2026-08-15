/**
 * Request Validation Middleware
 *
 * Wrapper around express-validator's validationResult.
 * Run this AFTER validation chains in route definitions.
 *
 * Usage:
 *   const { body } = require('express-validator');
 *
 *   router.post('/',
 *     [
 *       body('name').notEmpty().withMessage('Name is required'),
 *       body('email').isEmail().withMessage('Valid email is required'),
 *     ],
 *     validate,
 *     controller
 *   );
 */

const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const extractedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));

    const error = new Error('Validation failed');
    error.statusCode = 400;
    error.validationErrors = extractedErrors;

    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      statusCode: 400,
      errors: extractedErrors,
    });
  }

  next();
};

module.exports = validate;
