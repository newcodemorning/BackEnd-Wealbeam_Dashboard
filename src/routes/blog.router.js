const express = require('express');
const router = express.Router();
const { authenticateUser, authorizeRole } = require('../common/middleware/auth');
const { uploadPDF, getAllPDFs, downloadPDF, updatePDF, deletePDF } = require('../controllers/pdf.controller');
const multer = require('multer');
const path = require('path');

// Multer configuration using memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
    fileFilter: (req, file, cb) => {
        if (path.extname(file.originalname).toLowerCase() === '.pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF   files are allowed!'), false);
        }
    }
}).single('pdf');


router.post('/',authenticateUser,authorizeRole(['super-admin']),upload,uploadPDF);


module.exports = router;