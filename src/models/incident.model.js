const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
    dateTime: {
        type: Date,
        required: true,
        default: Date.now
    },
    severity: {
        type: String,
        required: true,
        enum: ['low', 'medium', 'high', 'critical']
    },
    type: {
        type: String,
        required: true,
        enum: ['physical', 'emotional', 'illness', 'emergency', 'fight', 'other']
    },
    description: {
        type: String,
        required: true
    },
    reporter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('Incident', incidentSchema);