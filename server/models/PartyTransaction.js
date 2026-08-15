const mongoose = require('mongoose');

const partyTransactionSchema = new mongoose.Schema(
  {
    partyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Party',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['get', 'give'], // 'get' = you get money (+), 'give' = you give money (-)
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
    isInterestAccrued: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

partyTransactionSchema.index({ partyId: 1, date: 1 });
partyTransactionSchema.index({ userId: 1 });

module.exports = mongoose.model('PartyTransaction', partyTransactionSchema);
