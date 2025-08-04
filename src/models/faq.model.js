const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
  question: { type: String },
  answer: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Faq', faqSchema);
