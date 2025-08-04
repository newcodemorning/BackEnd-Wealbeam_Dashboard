const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ContactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Contact = mongoose.model('Contact', ContactSchema);

module.exports = Contact; // Ensure you're exporting the model, not the schema.
