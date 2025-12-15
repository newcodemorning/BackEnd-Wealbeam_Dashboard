const mongoose = require('mongoose');

const pdfSchema = new mongoose.Schema({
  title: {
    en: { type: String, required: true },
    ar: { type: String, required: true }
  },
  description: {
    en: { type: String, default: '' },
    ar: { type: String, default: '' }
  },
  fileName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  coverImage: {
    type: String,
    default: null
  },
  supportedLanguages: {
    type: [String],
    enum: ['en', 'ar', 'fr', 'es', 'de'],
    default: ['en']
  },
  targetSchools: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'School' }],
    default: []
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  isVisible: {
    type: Boolean,
    default: true
  },
  viewCount: {
    type: Number,
    default: 0
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for better query performance
pdfSchema.index({ targetSchools: 1, isVisible: 1, isPublic: 1 });
pdfSchema.index({ viewCount: -1 });

module.exports = mongoose.model('PDF', pdfSchema);