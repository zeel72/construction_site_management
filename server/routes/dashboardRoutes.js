/**
 * Dashboard & Reports Routes
 */
const express = require('express');
const router = express.Router({ mergeParams: true });

const {
  getDashboardSummary,
  getReports,
} = require('../controllers/dashboardController');

const protect = require('../middleware/auth');

router.use(protect);

router.get('/summary', getDashboardSummary);
router.get('/reports', getReports);

module.exports = router;
