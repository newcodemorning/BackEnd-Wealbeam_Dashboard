const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient_role: {
        type: String,
        required: true,
        enum: ['super-admin', 'school', 'teacher', 'parent', 'student'],
        index: true
    },
    recipient_id: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'recipient_role',
        required: false
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['FORM_SUBMISSION', 'INCIDENT_REPORT', 'TICKET_CREATED', 'GENERAL'],
        default: 'GENERAL'
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    is_read: {
        type: Boolean,
        default: false,
        index: true
    }
}, { 
    timestamps: true 
});

// Compound index for efficient querying of unread notifications by role
notificationSchema.index({ recipient_role: 1, is_read: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
