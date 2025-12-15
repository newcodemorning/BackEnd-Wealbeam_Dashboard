const express = require('express');
const router = express.Router();
const { authenticateUser, authorizeRole } = require('../common/middleware/auth');
const {
  uploadPDF,
  getAllPDFs,
  getAllPDFsForDashboard,
  downloadPDF,
  updatePDF,
  deletePDF,
  migratePDFs
} = require('../controllers/pdf.controller');
const { upload } = require('../middleware/uploadMiddleware');

// Configure multer to accept PDF and cover image
const pdfUpload = upload.fields([
  { name: 'pdf', maxCount: 1 },
  { name: 'coverImage', maxCount: 1 }
]);

router.post(
  '/upload',
  authenticateUser,
  authorizeRole(['super-admin', 'school']),
  (req, res, next) => {
    req.meta = { type: 'pdfs' };
    next();
  },
  pdfUpload,
  uploadPDF
);

// Dashboard route - get all PDFs without filtering (admin only)
router.get(
  '/dashboard',
  authenticateUser,
  authorizeRole(['super-admin', 'school']),
  getAllPDFsForDashboard
);

router.get(
  '/',
  authenticateUser,
  authorizeRole(['parent', 'super-admin', 'student', 'teacher', 'school']),
  getAllPDFs
);

router.get(
  '/download/:id',
  authenticateUser,
  authorizeRole(['parent', 'super-admin', 'student', 'teacher', 'school']),
  downloadPDF
);

router.put(
  '/:id',
  authenticateUser,
  authorizeRole(['super-admin', 'school']),
  (req, res, next) => {
    req.meta = { type: 'pdfs' };
    next();
  },
  pdfUpload,
  updatePDF
);

router.delete(
  '/:id',
  authenticateUser,
  authorizeRole(['super-admin', 'school']),
  deletePDF
);

// Temporary migration route - remove after running once
router.post(
  '/migrate',
  authenticateUser,
  authorizeRole(['super-admin']),
  migratePDFs
);

module.exports = router;