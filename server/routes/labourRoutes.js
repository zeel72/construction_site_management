/**
 * Labour Routes
 * Mounted at: /api/sites/:siteId/labours
 */
const express = require('express');
const { body } = require('express-validator');
// mergeParams required to access :siteId from the parent router
const router = express.Router({ mergeParams: true });

const {
  getLabours,
  getLabour,
  addLabour,
  updateLabour,
  deleteLabour,
} = require('../controllers/labourController');

const protect = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(protect);

router
  .route('/')
  .get(getLabours)
  .post(
    [
      body('name').notEmpty().withMessage('Name is required'),
      body('dailyWage').isNumeric().withMessage('Valid daily wage is required'),
    ],
    validate,
    addLabour
  );

router
  .route('/:id')
  .get(getLabour)
  .put(updateLabour)
  .delete(deleteLabour);

module.exports = router;
