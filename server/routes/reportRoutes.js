const express = require('express');
const router = express.Router({ mergeParams: true });
const { getSiteFinancialReport } = require('../controllers/reportController');
const protect = require('../middleware/auth');

router.use(protect);

router.route('/financial').get(getSiteFinancialReport);

module.exports = router;
