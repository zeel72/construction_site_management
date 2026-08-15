/**
 * Material Bill Routes
 */
const express = require('express');
const { body } = require('express-validator');
const router = express.Router({ mergeParams: true });

const { getBills, getBill, createBill } = require('../controllers/materialBillController');
const protect = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(protect);

router
  .route('/')
  .get(getBills)
  .post(
    [
      body('billNumber').notEmpty().withMessage('Bill number is required'),
      body('supplierId').notEmpty().withMessage('Supplier ID is required'),
      body('billDate').isISO8601().toDate(),
      body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
      body('gstBreakup.isInterState').isBoolean(),
    ],
    validate,
    createBill
  );

router.route('/:id').get(getBill);

module.exports = router;
