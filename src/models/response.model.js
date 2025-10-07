const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    form: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Form',
        required: true
    },
    answers: [{
        question: {
            id: {
                type: mongoose.Schema.Types.ObjectId,
                required: true
            },
            text: {
                type: String,
                required: true
            },
            type: {
                type: String,
                required: true
            }
        },
        answer: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ['green', 'yellow', 'red'],
            required: true
        },
        trend: {
            type: String,
            enum: ['improving', 'worsening', 'stable', 'changed']
        }
    }],
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const Response = mongoose.model('Response', responseSchema);
module.exports = Response;