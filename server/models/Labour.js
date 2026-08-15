const mongoose = require('mongoose');

const labourSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String },
    skill: {
      type: String,
      enum: ['mason', 'carpenter', 'plumber', 'electrician', 'painter', 'helper', 'other'],
    },
    dailyWage: { type: Number, required: true },
    overtimeRate: { type: Number, default: 0 },
    address: { type: String },
    aadharNumber: { type: String },
    photo: { type: String },
    siteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Site', required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Indexes
labourSchema.index({ siteId: 1 });
labourSchema.index({ siteId: 1, phone: 1 }, { unique: true, partialFilterExpression: { phone: { $type: 'string' } } });

module.exports = mongoose.model('Labour', labourSchema);
