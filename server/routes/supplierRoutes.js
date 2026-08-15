/**
 * Supplier Routes
 */
const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const {
  getSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} = require('../controllers/supplierController');

const protect = require('../middleware/auth');
const authorize = require('../middleware/roleCheck');
const validate = require('../middleware/validate');

// All routes require authentication
router.use(protect);

router
  .route('/')
  .get(getSuppliers)
  .post(
    authorize('admin', 'supervisor'),
    [
      body('name').notEmpty().withMessage('Supplier name is required'),
      body('phone').notEmpty().withMessage('Phone is required'),
      body('state').notEmpty().withMessage('State is required for GST calculation'),
    ],
    validate,
    createSupplier
  );

router
  .route('/:id')
  .get(getSupplier)
  .put(
    authorize('admin', 'supervisor'),
    [
      body('name').optional().notEmpty(),
      body('state').optional().notEmpty(),
    ],
    validate,
    updateSupplier
  )
  .delete(authorize('admin', 'supervisor'), deleteSupplier);

module.exports = router;

