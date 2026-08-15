const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    address: { type: String },
    city: { type: String },
    state: { type: String, required: true },
    pincode: { type: String },
    gstin: { type: String },
    isGstRegistered: { type: Boolean, default: false },
    panNumber: { type: String },
    materialTypes: [{ type: String }],
    bankDetails: {
      bankName: { type: String },
      accountNumber: { type: String },
      ifscCode: { type: String },
      accountHolderName: { type: String },
    },
    // We can either compute totalBilled/Paid dynamically via aggregations
    // or store them here. The PRD lists them as auto fields.
    // For reliability in MVP, we will compute them via aggregation in controller,
    // but define them here for potential caching if needed later.
    totalBilled: { type: Number, default: 0 },
    totalPaid: { type: Number, default: 0 },
    balanceDue: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Indexes
supplierSchema.index({ state: 1 });
supplierSchema.index(
  { gstin: 1 },
  { unique: true, partialFilterExpression: { gstin: { $type: 'string', $exists: true, $ne: '' } } }
);

module.exports = mongoose.model('Supplier', supplierSchema);
