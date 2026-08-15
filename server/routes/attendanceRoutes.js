/**
 * Attendance Routes
 * Mounted at: /api/sites/:siteId/attendance
 */
const express = require('express');
const { body } = require('express-validator');
const router = express.Router({ mergeParams: true });

const {
  getAttendance,
  markAttendance,
} = require('../controllers/attendanceController');

const protect = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(protect);

router
  .route('/')
  .get(getAttendance)
  .post(
    [
      body('records').isArray().withMessage('Records must be an array'),
      body('records.*.labourId').notEmpty().withMessage('Labour ID required'),
      body('records.*.date').isISO8601().toDate().withMessage('Valid date required'),
      body('records.*.status').isIn(['present', 'absent', 'half_day']).withMessage('Invalid status'),
    ],
    validate,
    markAttendance
  );

module.exports = router;
