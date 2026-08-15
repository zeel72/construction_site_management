const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['labour', 'material'],
      required: true,
    },
    referenceId: { type: mongoose.Schema.Types.ObjectId, required: true }, // ref to Labour or Supplier
    referenceName: { type: String },
    siteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Site', required: true },
    amount: { type: Number, required: true },
    paymentDate: { type: Date, required: true },
    paymentMode: {
      type: String,
      enum: ['cash', 'upi', 'bank_transfer', 'cheque'],
      required: true,
    },
    transactionId: { type: String },
    receiptImage: { type: String },
    notes: { type: String },
    paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Indexes
paymentSchema.index({ siteId: 1 });
paymentSchema.index({ type: 1 });
paymentSchema.index({ referenceId: 1 });
paymentSchema.index({ paymentDate: 1 });

// Note: Post-save hook for updating MaterialBill.paidAmount is complex because
// payments can be made against a supplier broadly or a specific bill. 
// For this MVP, if type === 'material', we can optionally link it to a bill, 
// or the controller can handle the `paidAmount` update on the specific bill.
// We will rely on the controller for this business logic to keep the model clean.

module.exports = mongoose.model('Payment', paymentSchema);
