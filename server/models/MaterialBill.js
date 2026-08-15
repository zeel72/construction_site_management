const mongoose = require('mongoose');
const calculateGst = require('../utils/calculateGst');

const materialBillSchema = new mongoose.Schema(
  {
    billNumber: { type: String, required: true, unique: true },
    siteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Site', required: true },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
    supplierName: { type: String },
    supplierGstin: { type: String },
    billDate: { type: Date, required: true },
    dueDate: { type: Date },
    items: [
      {
        materialId: { type: mongoose.Schema.Types.ObjectId, ref: 'Material' },
        name: { type: String },
        hsnCode: { type: String },
        quantity: { type: Number },
        unit: { type: String },
        ratePerUnit: { type: Number },
        amount: { type: Number },
        gstRate: { type: Number, enum: [0, 5, 12, 18, 28] },
      },
    ],
    subtotal: { type: Number, default: 0 },
    discountPercent: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    taxableAmount: { type: Number, default: 0 },
    gstBreakup: {
      isInterState: { type: Boolean, default: false },
      cgstAmount: { type: Number, default: 0 },
      sgstAmount: { type: Number, default: 0 },
      igstAmount: { type: Number, default: 0 },
      totalGstAmount: { type: Number, default: 0 },
      rateWiseBreakup: [
        {
          gstRate: { type: Number },
          taxableAmount: { type: Number },
          cgst: { type: Number },
          sgst: { type: Number },
          igst: { type: Number },
          totalTax: { type: Number },
        },
      ],
    },
    grandTotal: { type: Number, default: 0 },
    roundOff: { type: Number, default: 0 },
    finalAmount: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['draft', 'pending', 'paid', 'partially_paid', 'cancelled'],
      default: 'pending',
    },
    invoiceImage: { type: String },
    notes: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for balance amount
materialBillSchema.virtual('balanceAmount').get(function () {
  return this.finalAmount - (this.paidAmount || 0);
});

// Pre-save hook to calculate GST and totals
materialBillSchema.pre('save', function () {
  // Always auto-calculate amount for each item
  if (this.items && this.items.length > 0) {
    this.items.forEach(item => {
      item.amount = (item.quantity || 0) * (item.ratePerUnit || 0);
    });
  }

  // Calculate GST using the utility
  const gstResult = calculateGst(this.items, this.gstBreakup.isInterState, this.discountPercent);
  
  this.subtotal = gstResult.subtotal;
  this.discountAmount = gstResult.discountAmount;
  this.taxableAmount = gstResult.taxableAmount;
  this.gstBreakup = gstResult.gstBreakup;
  this.grandTotal = gstResult.grandTotal;
  
  // Calculate final amount with round off
  this.finalAmount = this.grandTotal + (this.roundOff || 0);
  
  // Auto-update status based on payments
  if (this.status !== 'draft' && this.status !== 'cancelled') {
    if (this.paidAmount >= this.finalAmount) {
      this.status = 'paid';
    } else if (this.paidAmount > 0) {
      this.status = 'partially_paid';
    } else {
      this.status = 'pending';
    }
  }
});

materialBillSchema.index({ siteId: 1 });
materialBillSchema.index({ supplierId: 1 });
materialBillSchema.index({ billDate: 1 });
materialBillSchema.index({ status: 1 });

module.exports = mongoose.model('MaterialBill', materialBillSchema);
