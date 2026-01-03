const PDFService = require('../services/pdf.service');
const path = require('path');

// Temporary migration endpoint - remove after running once
const migratePDFs = async (req, res) => {
  try {
    const result = await PDFService.migrateOldPDFsToMultilingual();
    res.status(200).json({
      success: true,
      message: 'Migration completed successfully',
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const uploadPDF = async (req, res) => {
  try {
    if (!req.files || !req.files.pdf) {
      console.log('No PDF file found in request');
      return res.status(400).json({
        success: false,
        message: 'No PDF file uploaded. Please upload a PDF file with the field name "pdf"'
      });
    }

    console.log('[PDF Upload] Request body:', req.body);
    console.log('[PDF Upload] Files:', req.files);

    const pdfFile = req.files.pdf[0];
    const coverFile = req.files.coverImage ? req.files.coverImage[0] : null;

    // Parse multilingual title - handle bracket notation, dot notation in body, and separate fields
    const titleEn = req.body['title[en]'] || req.body['title.en'] || req.body.titleEn || '';
    const titleAr = req.body['title[ar]'] || req.body['title.ar'] || req.body.titleAr || titleEn;

    if (!titleEn) {
      return res.status(400).json({
        success: false,
        message: 'English title is required'
      });
    }

    // Parse multilingual description - handle bracket notation, dot notation in body, and separate fields
    const descriptionEn = req.body['description[en]'] || req.body['description.en'] || req.body.descriptionEn || '';
    const descriptionAr = req.body['description[ar]'] || req.body['description.ar'] || req.body.descriptionAr || descriptionEn;

    // Parse supported languages
    const supportedLanguages = req.body.supportedLanguages
      ? req.body.supportedLanguages.split(',').map(lang => lang.trim())
      : ['en'];

    // Parse target schools
    const targetSchools = req.body.targetSchools
      ? (Array.isArray(req.body.targetSchools)
        ? req.body.targetSchools
        : req.body.targetSchools.split(',').map(id => id.trim()).filter(Boolean))
      : [];

    const isPublic = req.body.isPublic === 'true' || req.body.isPublic === true || targetSchools.length === 0;
    const isVisible = req.body.isVisible !== 'false';

    const pdfData = {
      title: { en: titleEn, ar: titleAr },
      description: { en: descriptionEn, ar: descriptionAr },
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
    const lang = req.lang || 'en';
    const { page, limit, skip, sort, filter } = req.pagination;

    const total = await PDFService.countAllPDFs(filter);
    const pdfs = await PDFService.getAllPDFsForDashboard(lang, filter, skip, limit, sort);

    res.status(200).json({
      success: true,
      page,
      limit,
      total,
      pageCount: Math.ceil(total / limit),
      nextPage: page < Math.ceil(total / limit) ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null,
      data: pdfs
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllPDFs = async (req, res) => {
  try {
    const lang = req.lang || 'en';
    const { page, limit, skip, sort, filter } = req.pagination;

    const filterCount = {
      ...filter,
      isVisible: true,
      isPublic: true
    };
    const total = await PDFService.countPDFs(req.user.role, req.user.id, filterCount);
    const pdfs = await PDFService.getAllPDFs(req.user.role, req.user.id, lang, filter, skip, limit, sort);

    res.status(200).json({
      success: true,
      page,
      limit,
      total,
      pageCount: Math.ceil(total / limit),
      nextPage: page < Math.ceil(total / limit) ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null,
      data: pdfs
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const downloadPDF = async (req, res) => {
  try {
    const lang = req.lang || 'en';
    const pdf = await PDFService.getPDFById(req.params.id, req.user.role, req.user.id, lang);

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
    const { supportedLanguages, targetSchools, isPublic, isVisible } = req.body;

    console.log('[PDF Update] Request body:', req.body);

    const updateData = {};

    // Handle multilingual title - handle bracket notation, dot notation, and separate fields
    const titleEn = req.body['title[en]'] || req.body['title.en'] || req.body.titleEn;
    const titleAr = req.body['title[ar]'] || req.body['title.ar'] || req.body.titleAr;

    if (titleEn || titleAr) {
      updateData.title = {};
      if (titleEn) updateData.title.en = titleEn;
      if (titleAr) updateData.title.ar = titleAr;
    }

    // Handle multilingual description - handle bracket notation, dot notation, and separate fields
    const descriptionEn = req.body['description[en]'] || req.body['description.en'] || req.body.descriptionEn;
    const descriptionAr = req.body['description[ar]'] || req.body['description.ar'] || req.body.descriptionAr;

    if (descriptionEn !== undefined || descriptionAr !== undefined) {
      updateData.description = {};
      if (descriptionEn !== undefined) updateData.description.en = descriptionEn;
      if (descriptionAr !== undefined) updateData.description.ar = descriptionAr;
    }

    // Handle supported languages
    if (supportedLanguages) {
      updateData.supportedLanguages = supportedLanguages.split(',').map(lang => lang.trim());
    }

    // Handle target schools
    if (targetSchools !== undefined) {
      updateData.targetSchools = targetSchools
        ? (Array.isArray(targetSchools)
          ? targetSchools.filter(Boolean)
          : targetSchools.split(',').map(id => id.trim()).filter(Boolean))
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

    console.log('[PDF Update] Update data:', updateData);

    const updatedPDF = await PDFService.updatePDF(id, updateData, newPdfPath, newCoverPath);
    res.status(200).json({ success: true, data: updatedPDF });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getPDFForAdminById = async (req, res) => {
  try {
    const { id } = req.params;
    const pdf = await PDFService.getPDFForAdminById(id);

    if (!pdf) {
      return res.status(404).json({
        success: false,
        message: 'PDF not found'
      });
    }

    res.status(200).json({
      success: true,
      data: pdf
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getPDFByIdPublic = async (req, res) => {
  try {
    const { id } = req.params;
    const lang = req.lang || 'en';

    const pdf = await PDFService.getPDFByIdPublic(id, req.user.role, req.user.id, lang);

    if (!pdf) {
      return res.status(404).json({
        success: false,
        message: 'PDF not found'
      });
    }

    res.status(200).json({
      success: true,
      data: pdf
    });
  } catch (error) {
    if (error.message === 'PDF not available' || error.message === 'Access denied to this PDF') {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getPDFByIdForDashboard = async (req, res) => {
  try {
    const { id } = req.params;
    const pdf = await PDFService.getPDFByIdForDashboard(id);

    if (!pdf) {
      return res.status(404).json({
        success: false,
        message: 'PDF not found'
      });
    }

    res.status(200).json({
      success: true,
      data: pdf
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
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

const getFilterOptions = async (req, res) => {
  try {
    const filterOptions = await PDFService.getFilterOptions();
    res.status(200).json({ success: true, data: filterOptions });
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
  deletePDF,
  migratePDFs,
  getPDFForAdminById,
  getFilterOptions,



};  getPDFByIdForDashboard  getPDFByIdPublic, getPDFByIdPublic,
  getPDFByIdForDashboard
};
