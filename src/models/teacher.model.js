const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
    first_name: {
        ar: { type: String, required: true },
        en: { type: String, required: true }
    },
    last_name: {
        ar: { type: String, required: true },
        en: { type: String, required: true }
    },
    photo: { type: String, default: '' },
    age: { type: Number, default: 0 },
    title: { 
        type: String, 
        enum: ['Junior', 'Senior'], //  enum
        default: 'Junior' // set a default value
    },
    gender: { type: String, enum: ['Male', 'Female'], required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    school: { type: mongoose.Schema.Types.ObjectId, ref: "School" },
    classes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Class" }],
});

const Teacher = mongoose.model('Teacher', teacherSchema);

module.exports = Teacher;