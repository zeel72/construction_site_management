/**
 * Payment Routes
 */
const express = require('express');
const { body } = require('express-validator');
const router = express.Router({ mergeParams: true });

const { getPayments, createPayment } = require('../controllers/paymentController');
const protect = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(protect);

router
  .route('/')
  .get(getPayments)
  .post(
    [
      body('type').isIn(['labour', 'material']).withMessage('Invalid payment type'),
      body('referenceId').notEmpty().withMessage('Reference ID is required'),
      body('amount').isNumeric().withMessage('Amount is required'),
      body('paymentDate').isISO8601().toDate(),
      body('paymentMode').isIn(['cash', 'upi', 'bank_transfer', 'cheque']).withMessage('Invalid mode'),
    ],
    validate,
    createPayment
  );

module.exports = router;
