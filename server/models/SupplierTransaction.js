const mongoose = require('mongoose');

const supplierTransactionSchema = new mongoose.Schema(
  {
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['billed', 'paid'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

supplierTransactionSchema.index({ supplierId: 1, date: 1 });
supplierTransactionSchema.index({ userId: 1 });

module.exports = mongoose.model('SupplierTransaction', supplierTransactionSchema);
