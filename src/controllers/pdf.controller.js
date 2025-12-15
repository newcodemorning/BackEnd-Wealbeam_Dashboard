const PDFService = require('../services/pdf.service');
const path = require('path');

const uploadPDF = async (req, res) => {
  try {
    if (!req.files || !req.files.pdf) {
      console.log('No PDF file found in request');
      return res.status(400).json({
        success: false,
        message: 'No PDF file uploaded. Please upload a PDF file with the field name "pdf"'
      });
    }

    if (!req.body.title) {
      console.log('No title found in request');
      return res.status(400).json({
        success: false,
        message: 'Title is required'
      });
    }

    const pdfFile = req.files.pdf[0];
    const coverFile = req.files.coverImage ? req.files.coverImage[0] : null;

    // Parse supported languages
    const supportedLanguages = req.body.supportedLanguages
      ? req.body.supportedLanguages.split(',').map(lang => lang.trim())
      : ['en'];

    // Parse target schools
    const targetSchools = req.body.targetSchools
      ? req.body.targetSchools.split(',').map(id => id.trim()).filter(Boolean)
      : [];

    const isPublic = req.body.isPublic === 'true' || req.body.isPublic === true || targetSchools.length === 0;
    const isVisible = req.body.isVisible !== 'false';

    const pdfData = {
      title: req.body.title,
      description: req.body.description,
      fileName: pdfFile.originalname,
      supportedLanguages,
      targetSchools,
      isPublic,
      isVisible,
      uploadedBy: req.user.id
    };

    console.log('Attempting to create PDF with data:', pdfData);

    const newPDF = await PDFService.createPDF(
      pdfData,
      pdfFile.relativePath,
      coverFile?.relativePath
    );

    console.log('PDF created successfully:', newPDF);
    res.status(201).json({ success: true, data: newPDF });
  } catch (error) {
    console.error('PDF upload error details:', error);
    res.status(500).json({
      success: false,
      message: `PDF creation failed: ${error.message}`
    });
  }
};

const getAllPDFsForDashboard = async (req, res) => {
  try {
    const pdfs = await PDFService.getAllPDFsForDashboard();
    res.status(200).json({
      success: true,
      count: pdfs.length,
      data: pdfs
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllPDFs = async (req, res) => {
  try {
    const pdfs = await PDFService.getAllPDFs(req.user.role, req.user.id);
    res.status(200).json({ success: true, data: pdfs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const downloadPDF = async (req, res) => {
  try {
    const pdf = await PDFService.getPDFById(req.params.id, req.user.role, req.user.id);

    // Get the absolute path for download
    const uploadDir = process.env.ENVIRONMENT === 'production'
      ? '/var/www/files'
      : path.resolve('uploads');

    // Extract relative path from URL if needed
    let relativePath = pdf.filePath;
    const EnvBaseURL = process.env.ENVIRONMENT === 'production'
      ? process.env.PROD_BASE_URL
      : process.env.DEV_BASE_URL;

    if (relativePath.startsWith(EnvBaseURL)) {
      relativePath = relativePath.replace(EnvBaseURL + '/', '');
    }

    const absolutePath = path.join(uploadDir, relativePath);

    res.download(absolutePath, pdf.fileName);
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

const updatePDF = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, supportedLanguages, targetSchools, isPublic, isVisible } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    const updateData = { title, description };

    // Handle supported languages
    if (supportedLanguages) {
      updateData.supportedLanguages = supportedLanguages.split(',').map(lang => lang.trim());
    }

    // Handle target schools
    if (targetSchools !== undefined) {
      updateData.targetSchools = targetSchools
        ? targetSchools.split(',').map(id => id.trim()).filter(Boolean)
        : [];
    }

    // Handle visibility flags
    if (isPublic !== undefined) {
      updateData.isPublic = isPublic === 'true' || isPublic === true;
    }

    if (isVisible !== undefined) {
      updateData.isVisible = isVisible !== 'false';
    }

    const newPdfPath = req.files?.pdf?.[0]?.relativePath || null;
    const newCoverPath = req.files?.coverImage?.[0]?.relativePath || null;

    if (newPdfPath) {
      updateData.fileName = req.files.pdf[0].originalname;
    }

    const updatedPDF = await PDFService.updatePDF(id, updateData, newPdfPath, newCoverPath);
    res.status(200).json({ success: true, data: updatedPDF });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deletePDF = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await PDFService.deletePDF(id);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  uploadPDF,
  getAllPDFs,
  getAllPDFsForDashboard,
  downloadPDF,
  updatePDF,
  deletePDF
};
