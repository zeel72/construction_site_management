/**
 * Site Routes
 */
const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const {
  getSites,
  getSite,
  createSite,
  updateSite,
  deleteSite,
} = require('../controllers/siteController');

const protect = require('../middleware/auth');
const authorize = require('../middleware/roleCheck');
const validate = require('../middleware/validate');

// Import nested routers
const labourRouter = require('./labourRoutes');
const attendanceRouter = require('./attendanceRoutes');
const materialRouter = require('./materialRoutes');
const materialBillRouter = require('./materialBillRoutes');
const paymentRouter = require('./paymentRoutes');
const dashboardRouter = require('./dashboardRoutes');

// All routes require authentication
router.use(protect);

// Re-route into other resource routers
router.use('/:siteId/labours', labourRouter);
router.use('/:siteId/attendance', attendanceRouter);
router.use('/:siteId/materials', materialRouter);
router.use('/:siteId/material-bills', materialBillRouter);
router.use('/:siteId/payments', paymentRouter);
router.use('/:siteId/dashboard', dashboardRouter);

router
  .route('/')
  .get(getSites)
  .post(
    authorize('admin'),
    [
      body('name').notEmpty().withMessage('Site name is required'),
      body('location').notEmpty().withMessage('Location is required'),
      body('startDate').isISO8601().toDate().withMessage('Valid start date is required'),
    ],
    validate,
    createSite
  );

router
  .route('/:id')
  .get(getSite)
  .put(
    authorize('admin'),
    [
      body('name').optional().notEmpty().withMessage('Site name cannot be empty'),
      body('status').optional().isIn(['active', 'on_hold', 'completed']),
    ],
    validate,
    updateSite
  )
  .delete(authorize('admin'), deleteSite);

module.exports = router;

