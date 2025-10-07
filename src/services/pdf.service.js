const PDF = require('../models/pdf.model');
const { bucket } = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');

class PDFService {
  static async createPDF(data, file) {
    try {
      if (!file) {
        throw new Error('PDF file is required');
      }

      if (!file.buffer) {
        throw new Error('File buffer is missing');
      }

      // Generate unique filename
      const filename = `pdfs/${uuidv4()}-${file.originalname}`;
      const fileContent = bucket.file(filename);

      console.log('Starting file upload to Firebase...');
      console.log('File details:', {
        filename,
        size: file.size,
        mimetype: file.mimetype
      });

      // Upload to Firebase Storage
      try {
        await fileContent.save(file.buffer, {
          metadata: {
            contentType: file.mimetype || 'application/pdf',
            cacheControl: 'public, max-age=31536000'
          },
          resumable: false
        });
        console.log('File uploaded successfully to Firebase');
      } catch (uploadError) {
        console.error('Firebase upload error:', uploadError);
        throw new Error(`Failed to upload file to Firebase: ${uploadError.message}`);
      }

      // Make the file publicly accessible
      try {
        await fileContent.makePublic();
        console.log('File made public successfully');
      } catch (publicError) {
        console.error('Error making file public:', publicError);
        throw new Error(`Failed to make file public: ${publicError.message}`);
      }

      // Get the public URL using the getSignedUrl method for more reliability
      let pdfUrl;
      try {
        const [url] = await fileContent.getSignedUrl({
          action: 'read',
          expires: '03-01-2500' // Far future expiration
        });
        pdfUrl = url;
        console.log('Generated public URL:', pdfUrl);
      } catch (urlError) {
        console.error('Error generating public URL:', urlError);
        // Fallback to direct URL if signed URL fails
        pdfUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
        console.log('Using fallback URL:', pdfUrl);
      }

      // Create PDF record in database
      const pdf = new PDF({
        ...data,
        filePath: pdfUrl,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype || 'application/pdf'
      });

      const savedPdf = await pdf.save();
      console.log('PDF record saved to database:', savedPdf._id);
      
      return savedPdf;
    } catch (error) {
      console.error('PDF upload error:', error);
      throw new Error(`PDF creation failed: ${error.message}`);
    }
  }

  static async getAllPDFs() {
    try {
      return await PDF.find()
        .populate('uploadedBy', 'name email')
        .select('-__v');
    } catch (error) {
      throw new Error(`Failed to get PDFs: ${error.message}`);
    }
  }

  static async getPDFById(id) {
    try {
      const pdf = await PDF.findById(id)
        .populate('uploadedBy', 'name email')
        .select('-__v');
      
      if (!pdf) {
        throw new Error('PDF not found');
      }
      return pdf;
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

      // Delete from Firebase Storage
      const filename = pdf.filePath.split('/').pop();
      const file = bucket.file(`pdfs/${filename}`);
      await file.delete().catch(err => {
        console.error('Error deleting file from Firebase:', err);
      });

      // Delete from database
      await PDF.findByIdAndDelete(id);

      return { message: 'PDF deleted successfully' };
    } catch (error) {
      throw new Error(`Failed to delete PDF: ${error.message}`);
    }
  }

  static async updatePDF(id, data) {
    try {
      const pdf = await PDF.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true }
      );
      if (!pdf) {
        throw new Error('PDF not found');
      }
      return pdf;
    } catch (error) {
      throw new Error(`Failed to update PDF: ${error.message}`);
    }
  }
}

module.exports = PDFService;