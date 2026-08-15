/**
 * Material Routes
 */
const express = require('express');
const { body } = require('express-validator');
const router = express.Router({ mergeParams: true });

const { getMaterials, addMaterial } = require('../controllers/materialController');
const protect = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(protect);

router
  .route('/')
  .get(getMaterials)
  .post(
    [
      body('name').notEmpty().withMessage('Material name is required'),
      body('quantity').isNumeric().withMessage('Quantity is required'),
      body('unit').notEmpty().withMessage('Unit is required'),
      body('ratePerUnit').isNumeric().withMessage('Rate is required'),
      body('receivedDate').isISO8601().toDate(),
    ],
    validate,
    addMaterial
  );

module.exports = router;
