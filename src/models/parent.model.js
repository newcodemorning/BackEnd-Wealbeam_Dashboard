const mongoose = require('mongoose');

const parentSchema = new mongoose.Schema({
  first_name: {
    type: String,
    required: true,
  },
  last_name: {
    type: String,
    required: true,
  },

  date_of_birth: {
    type: Date,
    required: true,
  },
  profile_image: {
    type: String,
    default: null,
  },
  gender: {
    type: String,
    enum: ['Male', 'Female'],
    required: true,
  },

  second_email: {
    type: String,
    default: null,
  },
  first_phone: {
    type: String,
    required: true,
  },
  second_phone: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }],
});

const Parent = mongoose.model('Parent', parentSchema);

module.exports = Parent;
