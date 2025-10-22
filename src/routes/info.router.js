const express = require('express');
const router = express.Router();
const { authenticateUser, authorizeRole } = require('../common/middleware/auth');
const { uploadPDF, getAllPDFs, downloadPDF, updatePDF, deletePDF } = require('../controllers/pdf.controller');
const multer = require('multer');
const path = require('path');


router.get('/info', (req, res) => {
  res.send("Hello, welcome to the weallbeamtogether API! v5.10.22)");
}
);

module.exports = router;