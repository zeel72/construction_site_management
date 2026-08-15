/**
 * Payment Controller
 * Scoped to a specific site: /api/sites/:siteId/payments
 */
const Payment = require('../models/Payment');
const MaterialBill = require('../models/MaterialBill');
const Supplier = require('../models/Supplier');
const Labour = require('../models/Labour');

// @desc    Get all payments for a site
// @route   GET /api/sites/:siteId/payments
// @access  Private
exports.getPayments = async (req, res) => {
  const query = { siteId: req.params.siteId };
  if (req.query.type) query.type = req.query.type;

  const payments = await Payment.find(query)
    .populate('referenceId', 'name')
    .sort({ paymentDate: -1 });

  res.json({
    success: true,
    count: payments.length,
    data: payments,
  });
};

// @desc    Create new payment
// @route   POST /api/sites/:siteId/payments
// @access  Private
exports.createPayment = async (req, res) => {
  req.body.siteId = req.params.siteId;
  req.body.paidBy = req.user.id;

  const { type, referenceId, amount, materialBillId } = req.body;

  // Validate reference exists based on type
  if (type === 'labour') {
    const labour = await Labour.findById(referenceId);
    if (!labour) throw Object.assign(new Error('Labour not found'), { statusCode: 404 });
    req.body.referenceName = labour.name;
  } else if (type === 'material') {
    const supplier = await Supplier.findById(referenceId);
    if (!supplier) throw Object.assign(new Error('Supplier not found'), { statusCode: 404 });
    req.body.referenceName = supplier.name;
  }

  // Create payment record
  const payment = await Payment.create(req.body);

  // If it's a material payment AND linked to a specific bill, update the bill's paidAmount
  if (type === 'material' && materialBillId) {
    const bill = await MaterialBill.findById(materialBillId);
    if (bill) {
      bill.paidAmount = (bill.paidAmount || 0) + Number(amount);
      await bill.save(); // pre-save hook will update status automatically
    }
  }

  res.status(201).json({
    success: true,
    data: payment,
  });
};
