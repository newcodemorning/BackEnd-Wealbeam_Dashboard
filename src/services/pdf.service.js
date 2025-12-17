const PDF = require('../models/pdf.model');
const Student = require('../models/student.model');
const { deleteFile } = require('../middleware/uploadMiddleware');

class PDFService {

  // Temporary migration function - run once to update old data
  static async migrateOldPDFsToMultilingual() {
    try {
      console.log('[PDF Migration] Starting migration of old PDFs to multilingual format...');

      // Find PDFs with old string format (title is string, not object)
      const oldPDFs = await PDF.find({
        $or: [
          { 'title.en': { $exists: false } },
          { 'description.en': { $exists: false } }
        ]
      });

      console.log(`[PDF Migration] Found ${oldPDFs.length} PDFs to migrate`);

      let migrated = 0;
      for (const pdf of oldPDFs) {
        const updates = {};

        // Migrate title
        if (typeof pdf.title === 'string') {
          updates.title = {
            en: pdf.title,
            ar: pdf.title
          };
        }

        // Migrate description
        if (typeof pdf.description === 'string' || !pdf.description) {
          updates.description = {
            en: pdf.description || '',
            ar: pdf.description || ''
          };
        }

        if (Object.keys(updates).length > 0) {
          await PDF.findByIdAndUpdate(pdf._id, { $set: updates });
          migrated++;
          console.log(`[PDF Migration] Migrated PDF: ${pdf._id}`);
        }
      }

      console.log(`[PDF Migration] Successfully migrated ${migrated} PDFs`);
      return { success: true, migrated };
    } catch (error) {
      console.error('[PDF Migration] Error:', error);
      throw new Error(`Migration failed: ${error.message}`);
    }
  }

  static _localize(field, lang = 'en') {
    if (field === undefined || field === null) return '';
    if (typeof field === 'string') return field;
    if (field[lang]) return field[lang];
    if (field.en) return field.en;
    const first = Object.values(field).find(v => v !== undefined && v !== null && v !== '');
    return first || '';
  }

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

  static async getAllPDFs(userRole, userId, lang = 'en', filter = {}, skip = 0, limit = 10, sort = { uploadedAt: -1 }) {
    try {
      let query = { isVisible: true, ...filter };

      // If user is a student, filter by their school
      if (userRole === 'student') {
        const student = await Student.findOne({ user: userId }).select('school');
        if (!student || !student.school) {
          throw new Error('Student school not found');
        }

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
          query.isPublic = true;
        }
      }

      const pdfs = await PDF.find(query)
        .populate('uploadedBy', 'email')
        .populate('targetSchools', 'schoolName')
        .select('-__v')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();

      // Build full URLs for files
      const EnvBaseURL = process.env.ENVIRONMENT === 'production'
        ? process.env.PROD_BASE_URL
        : process.env.DEV_BASE_URL;

      return pdfs.map(pdf => ({
        ...pdf,
        title: this._localize(pdf.title, lang),
        description: this._localize(pdf.description, lang),
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

  static async countPDFs(userRole, userId, filter = {}) {
    try {
      let query = { isVisible: true, ...filter };

      // If user is a student, filter by their school
      if (userRole === 'student') {
        const student = await Student.findOne({ user: userId }).select('school');
        if (!student || !student.school) {
          throw new Error('Student school not found');
        }

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
          query.isPublic = true;
        }
      }

      return await PDF.countDocuments(query);
    } catch (error) {
      throw new Error(`Failed to count PDFs: ${error.message}`);
    }
  }

  static async getAllPDFsForDashboard(lang = 'en', filter = {}, skip = 0, limit = 10, sort = { uploadedAt: -1 }) {
    try {
      const pdfs = await PDF.find(filter)
        .populate('uploadedBy', 'email')
        .populate('targetSchools', 'schoolName')
        .select('-__v')
        .sort(sort)
        .skip(skip)
        .limit(limit)
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

  static async countAllPDFs(filter = {}) {
    try {
      return await PDF.countDocuments(filter);
    } catch (error) {
      throw new Error(`Failed to count all PDFs: ${error.message}`);
    }
  }

  static async getFilterOptions() {
    try {
      const supportedLanguages = await PDF.distinct('supportedLanguages');
      const targetSchools = await PDF.distinct('targetSchools');
      const uploaders = await PDF.distinct('uploadedBy');

      const School = require('../models/school.model');
      const User = require('../models/user.model');

      const schools = targetSchools.length > 0
        ? await School.find({ _id: { $in: targetSchools } })
          .select('_id schoolName')
          .lean()
        : [];

      const users = uploaders.length > 0
        ? await User.find({ _id: { $in: uploaders } })
          .select('_id email')
          .lean()
        : [];

      return {
        supportedLanguages: [...new Set(supportedLanguages.flat())],
        targetSchools: schools,
        uploaders: users,
        visibilityOptions: ['visible', 'hidden'],
        publicOptions: ['public', 'private']
      };
    } catch (error) {
      throw new Error(`Failed to get filter options: ${error.message}`);
    }
  }

  static async getPDFById(id, userRole, userId, lang = 'en') {
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
        title: this._localize(pdf.title, lang),
        description: this._localize(pdf.description, lang),
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

  static async getPDFByIdPublic(id, userRole, userId, lang = 'en') {
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
        _id: pdf._id,
        title: this._localize(pdf.title, lang),
        description: this._localize(pdf.description, lang),
        fileName: pdf.fileName,
        supportedLanguages: pdf.supportedLanguages,
        targetSchools: pdf.targetSchools,
        isPublic: pdf.isPublic,
        isVisible: pdf.isVisible,
        viewCount: (pdf.viewCount || 0) + 1,
        uploadedBy: pdf.uploadedBy,
        uploadedAt: pdf.uploadedAt,
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

  static async getPDFForAdminById(id) {
    try {
      const pdf = await PDF.findById(id)
        .populate('uploadedBy', 'email')
        .populate('targetSchools', 'schoolName')
        .select('-__v')
        .lean();

      if (!pdf) {
        throw new Error('PDF not found');
      }

      // Build full URLs for files
      const EnvBaseURL = process.env.ENVIRONMENT === 'production'
        ? process.env.PROD_BASE_URL
        : process.env.DEV_BASE_URL;

      return {
        ...pdf,
        filePath: pdf.filePath && !pdf.filePath.startsWith('http')
          ? `${EnvBaseURL}/${pdf.filePath}`
          : pdf.filePath,
        coverImage: pdf.coverImage && !pdf.coverImage.startsWith('http')
          ? `${EnvBaseURL}/${pdf.coverImage}`
          : pdf.coverImage
      };
    } catch (error) {
      throw new Error(`Failed to get PDF for admin: ${error.message}`);
    }
  }

  static async getPDFByIdForDashboard(id) {
    try {
      const pdf = await PDF.findById(id)
        .populate('uploadedBy', 'email')
        .populate('targetSchools', 'schoolName')
        .select('-__v')
        .lean();

      if (!pdf) {
        throw new Error('PDF not found');
      }

      // Build full URLs for files
      const EnvBaseURL = process.env.ENVIRONMENT === 'production'
        ? process.env.PROD_BASE_URL
        : process.env.DEV_BASE_URL;

      return {
        ...pdf,
        filePath: pdf.filePath && !pdf.filePath.startsWith('http')
          ? `${EnvBaseURL}/${pdf.filePath}`
          : pdf.filePath,
        coverImage: pdf.coverImage && !pdf.coverImage.startsWith('http')
          ? `${EnvBaseURL}/${pdf.coverImage}`
          : pdf.coverImage
      };
    } catch (error) {
      throw new Error(`Failed to get PDF for dashboard: ${error.message}`);
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