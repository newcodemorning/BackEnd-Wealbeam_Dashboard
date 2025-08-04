const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    fileUrl: { type: String, default: '' }, // URL to the uploaded photo
    category: { type: String, },
    title: { type: String, },
    question: { type: String },
    createdAt: { type: Date, default: Date.now },
});

 const Ticket= mongoose.model('Ticket', ticketSchema);
 module.exports = Ticket;