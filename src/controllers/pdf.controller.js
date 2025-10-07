const PDFService = require('../services/pdf.service');

const uploadPDF = async (req, res) => {
  try {
    if (!req.file) {
      console.log('No file found in request');
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded. Please make sure to send a PDF file with the field name "pdf"' 
      });
    }

    if (!req.body.title) {
      console.log('No title found in request');
      return res.status(400).json({
        success: false,
        message: 'Title is required'
      });
    }

    const pdfData = {
      title: req.body.title,
      description: req.body.description,
      uploadedBy: req.user.id
    };

    console.log('Attempting to create PDF with data:', pdfData);

    const newPDF = await PDFService.createPDF(pdfData, req.file);
    console.log('PDF created successfully:', newPDF);
    res.status(201).json({ success: true, data: newPDF });
  } catch (error) {
    console.error('PDF upload error details:', {
      error: error.message,
      stack: error.stack,
      body: req.body,
      file: req.file,
      user: req.user
    });
    res.status(500).json({ 
      success: false, 
      message: `PDF creation failed: ${error.message}`,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

const getAllPDFs = async (req, res) => {
  try {
    const pdfs = await PDFService.getAllPDFs();
    res.status(200).json({ success: true, data: pdfs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const downloadPDF = async (req, res) => {
  try {
    const pdf = await PDFService.getPDFById(req.params.id);
    res.download(pdf.filePath, pdf.fileName);
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

const updatePDF = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }
    const updatedPDF = await PDFService.updatePDF(id, { title, description });
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

module.exports = { uploadPDF, getAllPDFs, downloadPDF, updatePDF, deletePDF };
