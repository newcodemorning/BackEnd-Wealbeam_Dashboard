const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
    text: { type: String, required: true },
    name: { type: String, required: true },
    isDanger: { 
        type: Boolean,
        default: false
    }
});

const questionSchema = new mongoose.Schema({
    text: { type: String, required: true },
    type: { 
        type: String, 
        required: true,
        enum: ['slider', 'yesno', 'dropdown', 'radiobutton']
    },
    order: { type: Number, required: true },
    dangerAnswer: { 
        type: String,
        required: function() {
            return this.type === 'yesno';
        }
    },
    options: {
        type: [optionSchema],
        validate: {
            validator: function(v) {
                if (this.type === 'dropdown' || this.type === 'radiobutton') {
                    return v.length >= 2;
                }
                return true;
            },
            message: 'Dropdown and radiobutton questions must have at least 2 options'
        }
    }
}, { timestamps: true });

const formSchema = new mongoose.Schema({
    subject: {
        type: String,
        required: true,
        unique: true
    },
    questions: [questionSchema]
}, { timestamps: true });

module.exports = {
    Question: mongoose.model('Question', questionSchema),
    Form: mongoose.model('Form', formSchema)
};