/**
 * Auth Routes
 */
const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { register, login, getMe, changePassword } = require('../controllers/authController');
const protect = require('../middleware/auth');
const validate = require('../middleware/validate');

// @route   POST /api/auth/register
router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please include a valid email'),
    body('phone').notEmpty().withMessage('Phone number is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('role')
      .optional()
      .isIn(['admin', 'supervisor', 'viewer'])
      .withMessage('Invalid role'),
  ],
  validate,
  register
);

// @route   POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please include a valid email'),
    body('password').exists().withMessage('Password is required'),
  ],
  validate,
  login
);

// @route   GET /api/auth/me
router.get('/me', protect, getMe);

// @route   PUT /api/auth/password
router.put(
  '/password',
  [
    body('currentPassword').exists().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters'),
  ],
  validate,
  protect,
  changePassword
);

module.exports = router;

