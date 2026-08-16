const express = require('express');
const multer = require('multer');
const router = express.Router();
const protect = require('../middleware/auth');
const {
  uploadAttachment,
  getAttachments,
  getAttachmentFile,
  deleteAttachment,
} = require('../controllers/attachmentController');

// Multer config — store in memory (Buffer) for Base64 conversion
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, GIF, WebP images and PDF files are allowed'), false);
    }
  },
});

router.use(protect);

router
  .route('/')
  .get(getAttachments)
  .post(upload.single('file'), uploadAttachment);

router.route('/:id/file').get(getAttachmentFile);
router.route('/:id').delete(deleteAttachment);

module.exports = router;
