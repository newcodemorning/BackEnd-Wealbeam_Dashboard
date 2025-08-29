const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
  question: {
    ar: { type: String },
    en: { type: String },
  },
  answer: {
    ar: { type: String },
    en: { type: String },
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Faq', faqSchema);
