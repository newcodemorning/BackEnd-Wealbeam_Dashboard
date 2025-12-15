const PDF = require('../models/pdf.model');
const Student = require('../models/student.model');
const { deleteFile } = require('../middleware/uploadMiddleware');

class PDFService {
  static async createPDF(data, pdfPath, coverImagePath = null) {
    try {
      if (!pdfPath) {
        throw new Error('PDF file path is required');
      }

      console.log('Creating PDF record with:', {
        title: data.title,
        pdfPath,
        coverImagePath,
        supportedLanguages: data.supportedLanguages,
        targetSchools: data.targetSchools,
        isPublic: data.isPublic
      });

      // Create PDF record in database
      const pdf = new PDF({
        ...data,
        filePath: pdfPath,
        coverImage: coverImagePath,
        fileName: data.fileName
      });

      const savedPdf = await pdf.save();
      console.log('PDF record saved to database:', savedPdf._id);

      return savedPdf;
    } catch (error) {
      console.error('PDF creation error:', error);
      throw new Error(`PDF creation failed: ${error.message}`);
    }
  }

  static async getAllPDFs(userRole, userId) {
    try {
      let query = { isVisible: true };


      // temp function to update existing PDFs without isPublic field
      // await PDF.updateMany(
      //   { isPublic: { $exists: false } },
      //   { $set: { isPublic: true } }
      // );

      // await PDF.updateMany(
      //   { isVisible: { $exists: false } },
      //   { $set: { isVisible: true } }
      // );

      // await PDF.updateMany(
      //   { supportedLanguages: { $exists: false } },
      //   { $set: { supportedLanguages: ['en'] } }
      // );

      // await PDF.updateMany(
      //   { targetSchools: { $exists: false } },
      //   { $set: { targetSchools: [] } }
      // );

      // await PDF.updateMany(
      //   { viewCount: { $exists: false } },
      //   { $set: { viewCount: 0 } }
      // );

      // await PDF.updateMany(
      //   { uploadedAt: { $exists: false } },
      //   { $set: { uploadedAt: new Date() } }
      // );

      


      // If user is a student, filter by their school
      if (userRole === 'student') {
        const student = await Student.findOne({ user: userId }).select('school');
        if (!student || !student.school) {
          throw new Error('Student school not found');
        }

        // Get PDFs that are either public OR targeted to student's school
        query.$or = [
          { isPublic: true },
          { targetSchools: student.school }
        ];
      }

      // If user is a parent, get their children's schools
      if (userRole === 'parent') {
        const Parent = require('../models/parent.model');
        const parent = await Parent.findOne({ user: userId }).populate('students', 'school');

        if (parent && parent.students && parent.students.length > 0) {
          const schoolIds = [...new Set(parent.students.map(s => s.school).filter(Boolean))];

          query.$or = [
            { isPublic: true },
            { targetSchools: { $in: schoolIds } }
          ];
        } else {
          // If parent has no students, only show public PDFs
          query.isPublic = true;
        }
      }

      const pdfs = await PDF.find(query)
        .populate('uploadedBy', 'email')
        .populate('targetSchools', 'schoolName')
        .select('-__v')
        .sort({ uploadedAt: -1 })
        .lean();

      // Build full URLs for files
      const EnvBaseURL = process.env.ENVIRONMENT === 'production'
        ? process.env.PROD_BASE_URL
        : process.env.DEV_BASE_URL;

      return pdfs.map(pdf => ({
        ...pdf,
        filePath: pdf.filePath && !pdf.filePath.startsWith('http')
          ? `${EnvBaseURL}/${pdf.filePath}`
          : pdf.filePath,
        coverImage: pdf.coverImage && !pdf.coverImage.startsWith('http')
          ? `${EnvBaseURL}/${pdf.coverImage}`
          : pdf.coverImage
      }));
    } catch (error) {
      throw new Error(`Failed to get PDFs: ${error.message}`);
    }
  }

  static async getAllPDFsForDashboard() {
    try {
      const pdfs = await PDF.find()
        .populate('uploadedBy', 'email')
        .populate('targetSchools', 'schoolName')
        .select('-__v')
        .sort({ uploadedAt: -1 })
        .lean();

      // Build full URLs for files
      const EnvBaseURL = process.env.ENVIRONMENT === 'production'
        ? process.env.PROD_BASE_URL
        : process.env.DEV_BASE_URL;

      return pdfs.map(pdf => ({
        ...pdf,
        filePath: pdf.filePath && !pdf.filePath.startsWith('http')
          ? `${EnvBaseURL}/${pdf.filePath}`
          : pdf.filePath,
        coverImage: pdf.coverImage && !pdf.coverImage.startsWith('http')
          ? `${EnvBaseURL}/${pdf.coverImage}`
          : pdf.coverImage
      }));
    } catch (error) {
      throw new Error(`Failed to get PDFs for dashboard: ${error.message}`);
    }
  }

  static async getPDFById(id, userRole, userId) {
    try {
      const pdf = await PDF.findById(id)
        .populate('uploadedBy', 'email')
        .populate('targetSchools', 'schoolName')
        .select('-__v')
        .lean();

      if (!pdf) {
        throw new Error('PDF not found');
      }

      // Check visibility
      if (!pdf.isVisible && userRole !== 'super-admin' && userRole !== 'school') {
        throw new Error('PDF not available');
      }

      // Check access for students
      if (userRole === 'student') {
        const student = await Student.findOne({ user: userId }).select('school');
        if (!student) {
          throw new Error('Student not found');
        }

        const hasAccess = pdf.isPublic ||
          pdf.targetSchools.some(school => school._id.toString() === student.school.toString());

        if (!hasAccess) {
          throw new Error('Access denied to this PDF');
        }
      }

      // Check access for parents
      if (userRole === 'parent') {
        const Parent = require('../models/parent.model');
        const parent = await Parent.findOne({ user: userId }).populate('students', 'school');

        if (!parent) {
          throw new Error('Parent not found');
        }

        const schoolIds = parent.students.map(s => s.school?.toString()).filter(Boolean);
        const hasAccess = pdf.isPublic ||
          pdf.targetSchools.some(school => schoolIds.includes(school._id.toString()));

        if (!hasAccess) {
          throw new Error('Access denied to this PDF');
        }
      }

      // Increment view count
      await PDF.findByIdAndUpdate(id, { $inc: { viewCount: 1 } });

      // Build full URLs
      const EnvBaseURL = process.env.ENVIRONMENT === 'production'
        ? process.env.PROD_BASE_URL
        : process.env.DEV_BASE_URL;

      return {
        ...pdf,
        viewCount: (pdf.viewCount || 0) + 1,
        filePath: pdf.filePath && !pdf.filePath.startsWith('http')
          ? `${EnvBaseURL}/${pdf.filePath}`
          : pdf.filePath,
        coverImage: pdf.coverImage && !pdf.coverImage.startsWith('http')
          ? `${EnvBaseURL}/${pdf.coverImage}`
          : pdf.coverImage
      };
    } catch (error) {
      throw new Error(`Failed to get PDF: ${error.message}`);
    }
  }

  static async deletePDF(id) {
    try {
      const pdf = await PDF.findById(id);
      if (!pdf) {
        throw new Error('PDF not found');
      }

      // Delete PDF file from disk
      if (pdf.filePath) {
        deleteFile(pdf.filePath);
      }

      // Delete cover image from disk
      if (pdf.coverImage) {
        deleteFile(pdf.coverImage);
      }

      // Delete from database
      await PDF.findByIdAndDelete(id);

      return { message: 'PDF deleted successfully' };
    } catch (error) {
      throw new Error(`Failed to delete PDF: ${error.message}`);
    }
  }

  static async updatePDF(id, data, newPdfPath = null, newCoverPath = null) {
    try {
      const pdf = await PDF.findById(id);
      if (!pdf) {
        throw new Error('PDF not found');
      }

      // If new PDF file is uploaded, delete old one
      if (newPdfPath && pdf.filePath) {
        deleteFile(pdf.filePath);
        data.filePath = newPdfPath;
      }

      // If new cover image is uploaded, delete old one
      if (newCoverPath && pdf.coverImage) {
        deleteFile(pdf.coverImage);
        data.coverImage = newCoverPath;
      }

      const updatedPDF = await PDF.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true }
      ).populate('targetSchools', 'schoolName');

      return updatedPDF;
    } catch (error) {
      throw new Error(`Failed to update PDF: ${error.message}`);
    }
  }
}

module.exports = PDFService;