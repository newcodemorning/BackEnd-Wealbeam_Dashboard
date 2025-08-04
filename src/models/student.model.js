const mongoose = require('mongoose');
const studentSchema = new mongoose.Schema({
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    second_email: { type: String },
    photo: { type: String, default: '' },
    first_phone: { type: String, required: true },
    second_phone: { type: String },
    date_of_birth: { type: Date, required: true },
    gender: { type: String, enum: ['Male', 'Female'], required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    class: { type: mongoose.Schema.Types.ObjectId, ref: "Class" },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: "Parent" },
});
const Student = mongoose.model('Student', studentSchema);

module.exports = Student;
