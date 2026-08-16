const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema(
  {
    entityType: {
      type: String,
      enum: ['labour', 'supplier', 'party', 'material', 'bill', 'supplierTxn', 'partyTxn'],
      required: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      required: true,
    },
    fileData: {
      type: String, // Base64 encoded
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

attachmentSchema.index({ entityType: 1, entityId: 1 });
attachmentSchema.index({ userId: 1 });

module.exports = mongoose.model('Attachment', attachmentSchema);
