/**
 * Site Controller
 */
const Site = require('../models/Site');

// @desc    Get all sites
// @route   GET /api/sites
// @access  Private
exports.getSites = async (req, res) => {
  const query = {};
  if (req.query.status) query.status = req.query.status;

  const sites = await Site.find(query).sort({ createdAt: -1 });

  res.json({
    success: true,
    count: sites.length,
    data: sites,
  });
};

// @desc    Get single site
// @route   GET /api/sites/:id
// @access  Private
exports.getSite = async (req, res) => {
  const mongoose = require('mongoose');
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    const error = new Error('Site not found');
    error.statusCode = 404;
    throw error;
  }

  const site = await Site.findById(req.params.id);

  if (!site) {
    const error = new Error('Site not found');
    error.statusCode = 404;
    throw error;
  }

  res.json({
    success: true,
    data: site,
  });
};

// @desc    Create new site
// @route   POST /api/sites
// @access  Private (Admin only)
exports.createSite = async (req, res) => {
  req.body.createdBy = req.user.id; // Assign to logged-in user

  const site = await Site.create(req.body);

  res.status(201).json({
    success: true,
    data: site,
  });
};

// @desc    Update site
// @route   PUT /api/sites/:id
// @access  Private (Admin only)
exports.updateSite = async (req, res) => {
  let site = await Site.findById(req.params.id);

  if (!site) {
    const error = new Error('Site not found');
    error.statusCode = 404;
    throw error;
  }

  site = await Site.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.json({
    success: true,
    data: site,
  });
};

// @desc    Delete site
// @route   DELETE /api/sites/:id
// @access  Private (Admin only)
exports.deleteSite = async (req, res) => {
  const site = await Site.findById(req.params.id);

  if (!site) {
    const error = new Error('Site not found');
    error.statusCode = 404;
    throw error;
  }

  await site.deleteOne();

  res.json({
    success: true,
    data: {},
  });
};
