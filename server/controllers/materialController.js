/**
 * Material Controller
 * Scoped to a specific site: /api/sites/:siteId/materials
 */
const Material = require('../models/Material');
const Site = require('../models/Site');

// @desc    Get all materials for a site
// @route   GET /api/sites/:siteId/materials
// @access  Private
exports.getMaterials = async (req, res) => {
  const materials = await Material.find({ siteId: req.params.siteId })
    .populate('supplierId', 'name')
    .sort({ receivedDate: -1 });

  res.json({
    success: true,
    count: materials.length,
    data: materials,
  });
};

// @desc    Add single material directly (without full bill)
// @route   POST /api/sites/:siteId/materials
// @access  Private
exports.addMaterial = async (req, res) => {
  req.body.siteId = req.params.siteId;
  req.body.addedBy = req.user.id;

  const material = await Material.create(req.body);

  res.status(201).json({
    success: true,
    data: material,
  });
};
