/**
 * Labour Controller
 * Scoped to a specific site: /api/sites/:siteId/labours
 */
const Labour = require('../models/Labour');
const Site = require('../models/Site');

// @desc    Get all labours for a site (with total earned and paid wages)
// @route   GET /api/sites/:siteId/labours
// @access  Private
exports.getLabours = async (req, res) => {
  const Attendance = require('../models/Attendance');
  const Payment = require('../models/Payment');
  
  const labours = await Labour.find({ siteId: req.params.siteId }).sort({ name: 1 }).lean();

  const laboursWithStats = await Promise.all(
    labours.map(async (labour) => {
      // Get all attendances for this labourer
      const attendances = await Attendance.find({ labourId: labour._id });
      const totalEarned = attendances.reduce((acc, curr) => acc + curr.wageForDay, 0);

      // Get all payments for this labourer
      const payments = await Payment.find({ referenceId: labour._id, type: 'labour' });
      const totalPaid = payments.reduce((acc, curr) => acc + curr.amount, 0);

      return {
        ...labour,
        totalEarned,
        totalPaid,
        balanceDue: totalEarned - totalPaid
      };
    })
  );

  res.json({
    success: true,
    count: laboursWithStats.length,
    data: laboursWithStats,
  });
};

// @desc    Get single labour
// @route   GET /api/sites/:siteId/labours/:id
// @access  Private
exports.getLabour = async (req, res) => {
  const labour = await Labour.findOne({
    _id: req.params.id,
    siteId: req.params.siteId,
  });

  if (!labour) {
    const error = new Error('Labour not found on this site');
    error.statusCode = 404;
    throw error;
  }

  res.json({
    success: true,
    data: labour,
  });
};

// @desc    Add new labour to site
// @route   POST /api/sites/:siteId/labours
// @access  Private
exports.addLabour = async (req, res) => {
  // Ensure site exists
  const site = await Site.findById(req.params.siteId);
  if (!site) {
    const error = new Error('Site not found');
    error.statusCode = 404;
    throw error;
  }

  req.body.siteId = req.params.siteId;

  const labour = await Labour.create(req.body);

  res.status(201).json({
    success: true,
    data: labour,
  });
};

// @desc    Update labour
// @route   PUT /api/sites/:siteId/labours/:id
// @access  Private
exports.updateLabour = async (req, res) => {
  let labour = await Labour.findOne({
    _id: req.params.id,
    siteId: req.params.siteId,
  });

  if (!labour) {
    const error = new Error('Labour not found');
    error.statusCode = 404;
    throw error;
  }

  labour = await Labour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.json({
    success: true,
    data: labour,
  });
};
