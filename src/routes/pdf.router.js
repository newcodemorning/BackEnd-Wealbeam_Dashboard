const express = require('express');
const router = express.Router();
const { authenticateUser, authorizeRole } = require('../common/middleware/auth');
const { uploadPDF, getAllPDFs, downloadPDF, updatePDF, deletePDF } = require('../controllers/pdf.controller');
const multer = require('multer');
const path = require('path');

// Multer configuration using memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() === '.pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'), false);
    }
  }
}).single('pdf');

router.post(
  '/upload',
  authenticateUser,
  authorizeRole(['super-admin','school']),
  upload,
  uploadPDF
);

router.get(
  '/',
  authenticateUser,
  authorizeRole(['parent','super-admin']),
  getAllPDFs
);

router.get(
  '/download/:id',
  authenticateUser,
  authorizeRole(['parent','super-admin']),
  downloadPDF
);

router.put(
  '/:id',
  authenticateUser,
  authorizeRole(['super-admin','school']),
  updatePDF
);

router.delete(
  '/:id',
  authenticateUser,
  authorizeRole(['super-admin','school']),
  deletePDF
);

module.exports = router;