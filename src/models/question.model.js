const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
    text: {
        ar: { type: String, required: true },
        en: { type: String, required: true },
    },
    name: {
        ar: { type: String, default: "" },
        en: { type: String, default: "" }
    },
    score: {
        type: Number,
        required: true,
        min: 1,
        max: 10
    },
    isDanger: {
        type: Boolean,
        default: false
    }
});

const questionSchema = new mongoose.Schema({
    text: {
        ar: { type: String, required: true },
        en: { type: String, required: true },
    },
    type: {
        type: String,
        required: true,
        enum: ['slider', 'yesno', 'dropdown', 'radiobutton']
    },
    slider: {
        min: { type: Number },
        max: { type: Number },
        step: { type: Number, default: 1 }
    },
    score: {
        type: Number,
        min: 0,
        max: 10,
        default: function () {
            // For slider questions, "no score" means: use the slider answer value later.
            return this.type === 'slider' ? null : 0;
        }
    },
    order: { type: Number, required: true },
    dangerAnswer: {
        type: String,
        required: function () {
            return this.type === 'yesno';
        }
    },
    options: {
        type: [optionSchema],
        validate: {
            validator: function (v) {
                if (this.type === 'dropdown' || this.type === 'radiobutton' || this.type === 'yesno') {
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