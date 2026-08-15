/**
 * Supplier Controller
 */
const Supplier = require('../models/Supplier');
const MaterialBill = require('../models/MaterialBill');
const Payment = require('../models/Payment');
const SupplierTransaction = require('../models/SupplierTransaction');

// @desc    Get all suppliers
// @route   GET /api/suppliers
// @access  Private
exports.getSuppliers = async (req, res) => {
  const suppliers = await Supplier.find().sort({ name: 1 });

  // Calculate dynamic totals for each supplier
  const enrichedSuppliers = await Promise.all(
    suppliers.map(async (supplier) => {
      // 1. Total billed from MaterialBills
      const bills = await MaterialBill.aggregate([
        { $match: { supplierId: supplier._id, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$finalAmount' } } }
      ]);
      const billsTotal = bills.length > 0 ? bills[0].total : 0;

      // 2. Total paid from Payments
      const payments = await Payment.aggregate([
        { $match: { referenceId: supplier._id, type: 'material' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      const paymentsTotal = payments.length > 0 ? payments[0].total : 0;

      // 3. Direct supplier transactions (billed & paid)
      const directTxns = await SupplierTransaction.aggregate([
        { $match: { supplierId: supplier._id } },
        {
          $group: {
            _id: '$type',
            total: { $sum: '$amount' }
          }
        }
      ]);

      let directBilled = 0;
      let directPaid = 0;
      directTxns.forEach(t => {
        if (t._id === 'billed') directBilled = t.total;
        if (t._id === 'paid') directPaid = t.total;
      });

      const totalBilled = billsTotal + directBilled;
      const totalPaid = paymentsTotal + directPaid;
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

// @desc    Get single supplier with transactions
// @route   GET /api/suppliers/:id
// @access  Private
exports.getSupplier = async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);

  if (!supplier) {
    const error = new Error('Supplier not found');
    error.statusCode = 404;
    throw error;
  }
  
  // Calculate dynamic totals from MaterialBills
  const bills = await MaterialBill.aggregate([
    { $match: { supplierId: supplier._id, status: { $ne: 'cancelled' } } },
    { $group: { _id: null, total: { $sum: '$finalAmount' } } }
  ]);
  const billsTotal = bills.length > 0 ? bills[0].total : 0;

  const payments = await Payment.aggregate([
    { $match: { referenceId: supplier._id, type: 'material' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  const paymentsTotal = payments.length > 0 ? payments[0].total : 0;

  // Direct supplier transactions
  const directTxns = await SupplierTransaction.aggregate([
    { $match: { supplierId: supplier._id } },
    { $group: { _id: '$type', total: { $sum: '$amount' } } }
  ]);

  let directBilled = 0;
  let directPaid = 0;
  directTxns.forEach(t => {
    if (t._id === 'billed') directBilled = t.total;
    if (t._id === 'paid') directPaid = t.total;
  });

  const totalBilled = billsTotal + directBilled;
  const totalPaid = paymentsTotal + directPaid;

  // Get all direct transactions for the timeline
  const transactions = await SupplierTransaction.find({ supplierId: supplier._id }).sort({ date: -1 });

  res.json({
    success: true,
    data: {
      ...supplier.toObject(),
      totalBilled,
      totalPaid,
      balanceDue: totalBilled - totalPaid,
      transactions
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

  // Also delete all direct transactions for this supplier
  await SupplierTransaction.deleteMany({ supplierId: supplier._id });
  await supplier.deleteOne();

  res.json({
    success: true,
    data: {},
  });
};

// @desc    Add a direct transaction (billed or paid) to a supplier
// @route   POST /api/suppliers/:id/transactions
// @access  Private
exports.addSupplierTransaction = async (req, res) => {
  const { amount, type, description, date } = req.body;

  const supplier = await Supplier.findById(req.params.id);
  if (!supplier) {
    const error = new Error('Supplier not found');
    error.statusCode = 404;
    throw error;
  }

  const transaction = await SupplierTransaction.create({
    supplierId: supplier._id,
    userId: req.user.id,
    amount: Number(amount),
    type,
    description,
    date: date ? new Date(date) : Date.now()
  });

  res.status(201).json({ success: true, data: transaction });
};

// @desc    Get all transactions for a supplier
// @route   GET /api/suppliers/:id/transactions
// @access  Private
exports.getSupplierTransactions = async (req, res) => {
  const transactions = await SupplierTransaction.find({ supplierId: req.params.id }).sort({ date: -1 });
  res.json({ success: true, data: transactions });
};

// @desc    Delete a supplier transaction
// @route   DELETE /api/suppliers/:id/transactions/:txnId
// @access  Private
exports.deleteSupplierTransaction = async (req, res) => {
  const transaction = await SupplierTransaction.findOne({
    _id: req.params.txnId,
    supplierId: req.params.id,
  });

  if (!transaction) {
    const error = new Error('Transaction not found');
    error.statusCode = 404;
    throw error;
  }

  await transaction.deleteOne();
  res.json({ success: true, data: {} });
};
