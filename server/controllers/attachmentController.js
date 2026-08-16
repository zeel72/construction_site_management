const Attachment = require('../models/Attachment');

// @desc    Upload an attachment
// @route   POST /api/attachments
// @access  Private
exports.uploadAttachment = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No file uploaded' });
  }

  const { entityType, entityId } = req.body;
  if (!entityType || !entityId) {
    return res.status(400).json({ success: false, error: 'entityType and entityId are required' });
  }

  // Check file size (5MB limit)
  if (req.file.size > 5 * 1024 * 1024) {
    return res.status(400).json({ success: false, error: 'File size must be under 5MB' });
  }

  const attachment = await Attachment.create({
    entityType,
    entityId,
    fileName: req.file.originalname,
    fileType: req.file.mimetype,
    fileData: req.file.buffer.toString('base64'),
    fileSize: req.file.size,
    userId: req.user.id,
  });

  // Return metadata only (not the file data)
  res.status(201).json({
    success: true,
    data: {
      _id: attachment._id,
      entityType: attachment.entityType,
      entityId: attachment.entityId,
      fileName: attachment.fileName,
      fileType: attachment.fileType,
      fileSize: attachment.fileSize,
      createdAt: attachment.createdAt,
    },
  });
};

// @desc    Get attachments for an entity (metadata only)
// @route   GET /api/attachments?entityType=X&entityId=Y
// @access  Private
exports.getAttachments = async (req, res) => {
  const { entityType, entityId } = req.query;
  if (!entityType || !entityId) {
    return res.status(400).json({ success: false, error: 'entityType and entityId query params are required' });
  }

  const attachments = await Attachment.find({ entityType, entityId })
    .select('-fileData') // Don't send file data in list
    .sort({ createdAt: -1 });

  res.json({ success: true, data: attachments });
};

// @desc    Get/download a single attachment file
// @route   GET /api/attachments/:id/file
// @access  Private
exports.getAttachmentFile = async (req, res) => {
  const attachment = await Attachment.findById(req.params.id);
  if (!attachment) {
    return res.status(404).json({ success: false, error: 'Attachment not found' });
  }

  const fileBuffer = Buffer.from(attachment.fileData, 'base64');

  res.set({
    'Content-Type': attachment.fileType,
    'Content-Disposition': `inline; filename="${attachment.fileName}"`,
    'Content-Length': fileBuffer.length,
  });

  res.send(fileBuffer);
};

// @desc    Delete an attachment
// @route   DELETE /api/attachments/:id
// @access  Private
exports.deleteAttachment = async (req, res) => {
  const attachment = await Attachment.findById(req.params.id);
  if (!attachment) {
    return res.status(404).json({ success: false, error: 'Attachment not found' });
  }

  await attachment.deleteOne();
  res.json({ success: true, data: {} });
};
