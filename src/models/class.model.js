const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
    ClassName: { type: String, required: true },
    SelectDate: { type: Date, required: true },
    Subject: { type: String },
    school: { type: mongoose.Schema.Types.ObjectId, ref: "School" },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", default: null },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }],
});

const Class = mongoose.model('Class', classSchema);

module.exports = Class;
