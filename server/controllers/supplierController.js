/**
 * Supplier Controller
 */
const Supplier = require('../models/Supplier');
const MaterialBill = require('../models/MaterialBill');
const Payment = require('../models/Payment');

// @desc    Get all suppliers
// @route   GET /api/suppliers
// @access  Private
exports.getSuppliers = async (req, res) => {
  const suppliers = await Supplier.find().sort({ name: 1 });

  // Calculate dynamic totals for each supplier
  const enrichedSuppliers = await Promise.all(
    suppliers.map(async (supplier) => {
      // 1. Total billed from all MaterialBills for this supplier
      const bills = await MaterialBill.aggregate([
        { $match: { supplierId: supplier._id, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$finalAmount' } } }
      ]);
      const totalBilled = bills.length > 0 ? bills[0].total : 0;

      // 2. Total paid from all Payments to this supplier
      const payments = await Payment.aggregate([
        { $match: { referenceId: supplier._id, type: 'material' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      const totalPaid = payments.length > 0 ? payments[0].total : 0;

      const balanceDue = totalBilled - totalPaid;

      return {
        ...supplier.toObject(),
        totalBilled,
        totalPaid,
        balanceDue
      };
    })
  );

  res.json({
    success: true,
    count: enrichedSuppliers.length,
    data: enrichedSuppliers,
  });
};

// @desc    Get single supplier
// @route   GET /api/suppliers/:id
// @access  Private
exports.getSupplier = async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);

  if (!supplier) {
    const error = new Error('Supplier not found');
    error.statusCode = 404;
    throw error;
  }
  
  // Calculate dynamic totals
  const bills = await MaterialBill.aggregate([
    { $match: { supplierId: supplier._id, status: { $ne: 'cancelled' } } },
    { $group: { _id: null, total: { $sum: '$finalAmount' } } }
  ]);
  const totalBilled = bills.length > 0 ? bills[0].total : 0;

  const payments = await Payment.aggregate([
    { $match: { referenceId: supplier._id, type: 'material' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  const totalPaid = payments.length > 0 ? payments[0].total : 0;

  res.json({
    success: true,
    data: {
      ...supplier.toObject(),
      totalBilled,
      totalPaid,
      balanceDue: totalBilled - totalPaid
    },
  });
};

// @desc    Create new supplier
// @route   POST /api/suppliers
// @access  Private (Admin only)
exports.createSupplier = async (req, res) => {
  const supplier = await Supplier.create(req.body);

  res.status(201).json({
    success: true,
    data: supplier,
  });
};

// @desc    Update supplier
// @route   PUT /api/suppliers/:id
// @access  Private (Admin only)
exports.updateSupplier = async (req, res) => {
  let supplier = await Supplier.findById(req.params.id);

  if (!supplier) {
    const error = new Error('Supplier not found');
    error.statusCode = 404;
    throw error;
  }

  supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.json({
    success: true,
    data: supplier,
  });
};

// @desc    Delete supplier
// @route   DELETE /api/suppliers/:id
// @access  Private (Admin only)
exports.deleteSupplier = async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);

  if (!supplier) {
    const error = new Error('Supplier not found');
    error.statusCode = 404;
    throw error;
  }

  await supplier.deleteOne();

  res.json({
    success: true,
    data: {},
  });
};
