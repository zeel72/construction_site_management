const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: {
      type: String,
      enum: ['cement', 'sand', 'aggregate', 'bricks', 'steel', 'wood', 'plumbing', 'electrical', 'paint', 'other'],
    },
    hsnCode: { type: String },
    quantity: { type: Number, required: true },
    unit: {
      type: String,
      enum: ['bags', 'kg', 'tons', 'cubic_ft', 'cubic_m', 'pieces', 'liters', 'meters', 'sq_ft'],
      required: true,
    },
    ratePerUnit: { type: Number, required: true },
    totalAmount: { type: Number, default: 0 },
    gstRate: { type: Number, enum: [0, 5, 12, 18, 28] },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
    supplierName: { type: String },
    billId: { type: mongoose.Schema.Types.ObjectId, ref: 'MaterialBill' },
    invoiceNumber: { type: String },
    invoiceImage: { type: String },
    receivedDate: { type: Date, required: true },
    siteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Site', required: true },
    notes: { type: String },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Pre-save hook to auto-calculate totalAmount
materialSchema.pre('save', function (next) {
  if (this.isModified('quantity') || this.isModified('ratePerUnit')) {
    this.totalAmount = (this.quantity || 0) * (this.ratePerUnit || 0);
  }
  next();
});

materialSchema.index({ siteId: 1 });
materialSchema.index({ category: 1 });
materialSchema.index({ receivedDate: 1 });

module.exports = mongoose.model('Material', materialSchema);
