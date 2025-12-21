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
  migratePDFs,
  getPDFForAdminById,
  getFilterOptions,
  getPDFByIdPublic,
  getPDFByIdForDashboard
} = require('../controllers/pdf.controller');
const { upload } = require('../middleware/uploadMiddleware');
const pagination = require('../middleware/pagination');

// Configure multer to accept PDF and cover image
const pdfUpload = upload.fields([
  { name: 'pdf', maxCount: 1 },
  { name: 'coverImage', maxCount: 1 }
]);

// Temporary migration route - MUST be before /:id route
router.post(
  '/migrate/temp/data',
  authenticateUser,
  authorizeRole(['super-admin']),
  migratePDFs
);

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

// Dashboard route - get all PDFs without filtering (admin only) with pagination
router.get(
  '/dashboard',
  authenticateUser,
  authorizeRole(['super-admin', 'school']),
  pagination({
    defaultLimit: 10,
    maxLimit: 100,
    allowedFilters: ['search', 'isVisible', 'isPublic', 'uploadedBy', 'targetSchools', 'supportedLanguages']
  }),
  getAllPDFsForDashboard
);

// Filter options route
router.get(
  '/filter/options',
  authenticateUser,
  authorizeRole(['super-admin', 'school', 'teacher', 'parent', 'student']),
  getFilterOptions
);

// Admin route - get single PDF with all data for editing (returns both ar & en)
router.get(
  '/admin/:id',
  authenticateUser,
  authorizeRole(['super-admin', 'school']),
  getPDFForAdminById
);

// Dashboard route - get single PDF with all language data (same as admin, kept for backward compatibility)
// Note: This is now the same as /admin/:id - kept for backward compatibility
router.get(
  '/dashboard/:id',
  authenticateUser,
  authorizeRole(['super-admin', 'school']),
  getPDFByIdForDashboard
);

// Download route - must be before /:id
router.get(
  '/download/:id',
  authenticateUser,
  authorizeRole(['parent', 'super-admin', 'student', 'teacher', 'school']),
  downloadPDF
);

// Public route - get single PDF by ID with language support
router.get(
  '/:id',
  authenticateUser,
  authorizeRole(['parent', 'super-admin', 'student', 'teacher', 'school']),
  getPDFByIdPublic
);

router.get(
  '/',
  authenticateUser,
  authorizeRole(['parent', 'super-admin', 'student', 'teacher', 'school']),
  pagination({
    defaultLimit: 10,
    maxLimit: 50,
    allowedFilters: ['search', 'targetSchools', 'supportedLanguages']
  }),
  getAllPDFs
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

module.exports = router;