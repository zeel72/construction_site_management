const mongoose = require('mongoose');

const partySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    partyType: {
      type: String,
      enum: ['customer', 'supplier', 'lender', 'borrower', 'other'],
      default: 'other',
    },
    isInterestActive: {
      type: Boolean,
      default: false,
    },
    interestRate: {
      type: Number,
      default: 0, // e.g., 2 for 2%
    },
    interestType: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: 'monthly',
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    }
  },
  { timestamps: true }
);

partySchema.index({ userId: 1 });

module.exports = mongoose.model('Party', partySchema);
