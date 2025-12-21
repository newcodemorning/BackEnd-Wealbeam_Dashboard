const PDF = require('../models/pdf.model');
const Student = require('../models/student.model');
const { deleteFile } = require('../middleware/uploadMiddleware');

class PDFService {

  // Temporary migration function - run once to update old data
  static async migrateOldPDFsToMultilingual() {
    try {
      console.log('[PDF Migration] Starting migration of old PDFs to multilingual format...');

      // Find all PDFs to check their structure
      const allPDFs = await PDF.find().lean();

      console.log(`[PDF Migration] Found ${allPDFs.length} total PDFs to check`);

      let migrated = 0;
      let skipped = 0;

      // Default values
      const DEFAULT_COVER_IMAGE = "https://api.weallbeamtogether.co.uk/uploads/pdfs/2025/12/21/images/FILE_book_20251221_1766324532414_798.jpg";
      const DEFAULT_SUPPORTED_LANGUAGES = ['en'];
      const DEFAULT_IS_VISIBLE = true;
      const DEFAULT_IS_PUBLIC = true;
      const DEFAULT_VIEW_COUNT = 0;
      const DEFAULT_TARGET_SCHOOLS = [];

      for (const pdf of allPDFs) {
        const updates = {};
        let hasChanges = false;

        // Check and migrate title
        if (typeof pdf.title === 'string') {
          updates.title = {
            en: pdf.title,
            ar: pdf.title
          };
          hasChanges = true;
          console.log(`[PDF Migration] Title to migrate: "${pdf.title}"`);
        } else if (!pdf.title || !pdf.title.en) {
          const titleValue = typeof pdf.title === 'object' ? (pdf.title.ar || '') : '';
          updates.title = {
            en: titleValue,
            ar: titleValue
          };
          hasChanges = true;
          console.log(`[PDF Migration] Title object missing 'en': fixing`);
        }

        // Check and migrate description
        if (typeof pdf.description === 'string') {
          updates.description = {
            en: pdf.description,
            ar: pdf.description
          };
          hasChanges = true;
          console.log(`[PDF Migration] Description to migrate: "${pdf.description}"`);
        } else if (!pdf.description) {
          updates.description = {
            en: '',
            ar: ''
          };
          hasChanges = true;
        } else if (typeof pdf.description === 'object' && !pdf.description.en) {
          const descValue = pdf.description.ar || '';
          updates.description = {
            en: descValue,
            ar: descValue
          };
          hasChanges = true;
        }

        // Check and set coverImage
        if (!pdf.coverImage || pdf.coverImage === null || pdf.coverImage === '') {
          updates.coverImage = DEFAULT_COVER_IMAGE;
          hasChanges = true;
          console.log(`[PDF Migration] Setting default cover image for PDF: ${pdf._id}`);
        }

        // Check and set supportedLanguages
        if (!pdf.supportedLanguages || !Array.isArray(pdf.supportedLanguages) || pdf.supportedLanguages.length === 0) {
          updates.supportedLanguages = DEFAULT_SUPPORTED_LANGUAGES;
          hasChanges = true;
          console.log(`[PDF Migration] Setting default supported languages for PDF: ${pdf._id}`);
        }

        // Check and set isVisible
        if (pdf.isVisible === undefined || pdf.isVisible === null) {
          updates.isVisible = DEFAULT_IS_VISIBLE;
          hasChanges = true;
          console.log(`[PDF Migration] Setting default isVisible for PDF: ${pdf._id}`);
        }

        // Check and set isPublic
        if (pdf.isPublic === undefined || pdf.isPublic === null) {
          updates.isPublic = DEFAULT_IS_PUBLIC;
          hasChanges = true;
          console.log(`[PDF Migration] Setting default isPublic for PDF: ${pdf._id}`);
        }

        // Check and set viewCount
        if (pdf.viewCount === undefined || pdf.viewCount === null || pdf.viewCount < 0) {
          updates.viewCount = DEFAULT_VIEW_COUNT;
          hasChanges = true;
          console.log(`[PDF Migration] Setting default viewCount for PDF: ${pdf._id}`);
        }

        // Check and set targetSchools
        if (!pdf.targetSchools || !Array.isArray(pdf.targetSchools)) {
          updates.targetSchools = DEFAULT_TARGET_SCHOOLS;
          hasChanges = true;
          console.log(`[PDF Migration] Setting default targetSchools for PDF: ${pdf._id}`);
        }

        // Check and set fileName
        if (!pdf.fileName || pdf.fileName === '') {
          // Extract filename from filePath if possible
          if (pdf.filePath) {
            const pathParts = pdf.filePath.split('/');
            updates.fileName = pathParts[pathParts.length - 1] || 'untitled.pdf';
          } else {
            updates.fileName = 'untitled.pdf';
          }
          hasChanges = true;
          console.log(`[PDF Migration] Setting default fileName for PDF: ${pdf._id}`);
        }

        // Perform update if there are changes
        if (hasChanges) {
          await PDF.findByIdAndUpdate(pdf._id, { $set: updates });
          migrated++;
          console.log(`[PDF Migration] Migrated PDF: ${pdf._id} - "${pdf.title || 'untitled'}"`);
          console.log(`[PDF Migration] Applied updates:`, Object.keys(updates));
        } else {
          skipped++;
        }
      }

      console.log(`[PDF Migration] Successfully migrated ${migrated} PDFs, skipped ${skipped} PDFs`);
      return {
        success: true,
        migrated,
        skipped,
        total: allPDFs.length,
        message: `Migrated ${migrated} PDFs, skipped ${skipped} already migrated PDFs`,
        details: {
          defaultsApplied: {
            coverImage: DEFAULT_COVER_IMAGE,
            supportedLanguages: DEFAULT_SUPPORTED_LANGUAGES,
            isVisible: DEFAULT_IS_VISIBLE,
            isPublic: DEFAULT_IS_PUBLIC,
            viewCount: DEFAULT_VIEW_COUNT,
            targetSchools: DEFAULT_TARGET_SCHOOLS
          }
        }
      };
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
      // Clone filter to avoid mutation
      const cleanFilter = { ...filter };
      let query = { isVisible: true };

      // Handle search filter
      if (cleanFilter.$search || cleanFilter.$searchRegex) {
        const regex = cleanFilter.$searchRegex;
        query.$or = [
          { 'title.en': regex },
          { 'title.ar': regex },
          { 'description.en': regex },
          { 'description.ar': regex },
          { fileName: regex }
        ];
        delete cleanFilter.$search;
        delete cleanFilter.$searchRegex;
      }

      // Merge remaining filters
      query = { ...query, ...cleanFilter };

      console.log('[PDF Service] Query:', JSON.stringify(query, null, 2));

      // If user is a student, filter by their school
      if (userRole === 'student') {
        const student = await Student.findOne({ user: userId }).select('school');
        if (!student || !student.school) {
          throw new Error('Student school not found');
        }

        query.$and = [
          query.$or ? { $or: query.$or } : {},
          {
            $or: [
              { isPublic: true },
              { targetSchools: student.school }
            ]
          }
        ];
        delete query.$or;
      }

      // If user is a parent, get their children's schools
      if (userRole === 'parent') {
        const Parent = require('../models/parent.model');
        const parent = await Parent.findOne({ user: userId }).populate('students', 'school');

        if (parent && parent.students && parent.students.length > 0) {
          const schoolIds = [...new Set(parent.students.map(s => s.school).filter(Boolean))];

          query.$and = [
            query.$or ? { $or: query.$or } : {},
            {
              $or: [
                { isPublic: true },
                { targetSchools: { $in: schoolIds } }
              ]
            }
          ];
          delete query.$or;
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
      // Clone filter and remove search keys
      const cleanFilter = { ...filter };
      delete cleanFilter.$search;
      delete cleanFilter.$searchRegex;

      let query = { isVisible: true, ...cleanFilter };

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
      // Clone filter to avoid mutation
      const cleanFilter = { ...filter };
      let query = {};

      // Handle search filter
      if (cleanFilter.$search || cleanFilter.$searchRegex) {
        const regex = cleanFilter.$searchRegex;
        query.$or = [
          { 'title.en': regex },
          { 'title.ar': regex },
          { 'description.en': regex },
          { 'description.ar': regex },
          { fileName: regex }
        ];
        delete cleanFilter.$search;
        delete cleanFilter.$searchRegex;
      }

      // Merge remaining filters
      query = { ...query, ...cleanFilter };

      console.log('[PDF Dashboard] Query:', JSON.stringify(query, null, 2));

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
      // Clone filter and remove search keys
      const cleanFilter = { ...filter };
      let query = {};

      if (cleanFilter.$search || cleanFilter.$searchRegex) {
        const regex = cleanFilter.$searchRegex;
        query.$or = [
          { 'title.en': regex },
          { 'title.ar': regex },
          { 'description.en': regex },
          { 'description.ar': regex },
          { fileName: regex }
        ];
        delete cleanFilter.$search;
        delete cleanFilter.$searchRegex;
      }

      query = { ...query, ...cleanFilter };

      console.log('[PDF Count] Query:', JSON.stringify(query, null, 2));

      return await PDF.countDocuments(query);
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