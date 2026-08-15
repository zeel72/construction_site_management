/**
 * Material Bill Controller (with GST)
 * Scoped to a specific site: /api/sites/:siteId/material-bills
 */
const MaterialBill = require('../models/MaterialBill');
const Material = require('../models/Material');
const Supplier = require('../models/Supplier');

// @desc    Get all bills for a site
// @route   GET /api/sites/:siteId/material-bills
// @access  Private
exports.getBills = async (req, res) => {
  const bills = await MaterialBill.find({ siteId: req.params.siteId })
    .populate('supplierId', 'name')
    .sort({ billDate: -1 });

  res.json({
    success: true,
    count: bills.length,
    data: bills,
  });
};

// @desc    Get single bill
// @route   GET /api/sites/:siteId/material-bills/:id
// @access  Private
exports.getBill = async (req, res) => {
  const bill = await MaterialBill.findOne({
    _id: req.params.id,
    siteId: req.params.siteId,
  }).populate('supplierId');

  if (!bill) {
    const error = new Error('Bill not found');
    error.statusCode = 404;
    throw error;
  }

  res.json({
    success: true,
    data: bill,
  });
};

// @desc    Create new material bill with GST calc and create individual materials
// @route   POST /api/sites/:siteId/material-bills
// @access  Private
exports.createBill = async (req, res) => {
  req.body.siteId = req.params.siteId;
  req.body.createdBy = req.user.id;
  
  const supplier = await Supplier.findById(req.body.supplierId);
  if (!supplier) {
    const error = new Error('Supplier not found');
    error.statusCode = 404;
    throw error;
  }
  
  req.body.supplierName = supplier.name;
  req.body.supplierGstin = supplier.gstin;

  // Create the bill first (pre-save hook will calc GST automatically)
  const bill = await MaterialBill.create(req.body);

  // Now create individual Material records for inventory tracking
  const materials = bill.items.map((item) => ({
    name: item.name,
    category: 'other', // Or infer from item if needed
    hsnCode: item.hsnCode,
    quantity: item.quantity,
    unit: item.unit,
    ratePerUnit: item.ratePerUnit,
    gstRate: item.gstRate,
    supplierId: supplier._id,
    supplierName: supplier.name,
    billId: bill._id,
    invoiceNumber: bill.billNumber,
    receivedDate: bill.billDate,
    siteId: req.params.siteId,
    addedBy: req.user.id,
  }));

  // Insert all materials to inventory
  await Material.insertMany(materials);

  res.status(201).json({
    success: true,
    data: bill,
  });
};
