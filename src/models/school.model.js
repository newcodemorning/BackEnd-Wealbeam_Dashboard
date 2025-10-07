const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
    schoolName: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    subscriptionEndDate: { type: Date, required: true },
    language: { type: String },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to the User model
    teachers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Teacher" }],
    classes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Class" }],
});

const School = mongoose.model('School', schoolSchema);

module.exports = School;
