const mongoose = require('mongoose');

const siteSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    location: { type: String, required: true },
    description: { type: String },
    clientName: { type: String },
    clientPhone: { type: String },
    startDate: { type: Date, required: true },
    expectedEndDate: { type: Date },
    status: {
      type: String,
      enum: ['active', 'on_hold', 'completed'],
      default: 'active',
    },
    totalBudget: { type: Number },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Indexes for faster querying
siteSchema.index({ createdBy: 1 });
siteSchema.index({ status: 1 });

module.exports = mongoose.model('Site', siteSchema);
