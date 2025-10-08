const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const { bucket } = require('../config/firebase'); // If you're uploading files to Firebase Storage
const User = require('../models/user.model');
const Teacher = require('../models/teacher.model');
const School = require('../models/school.model');
const Class = require('../models/class.model');

// Add a new student
const addTeacher = async (data, file) => {
  const { email, password, schoolId, ...rest } = data;
  const existingUser = await User.findOne({ email: email });
  if (existingUser) {
    throw new Error('Email already registered.');
  }
  let photo = ''
  if (file) {
    const fileconten = bucket.file(`uploads/${file.originalname}`);
    await fileconten.save(file.buffer, {
      metadata: { contentType: file.mimetype },
    });
    await fileconten.makePublic();

    // Get the public URL of the uploaded file
    const photoUrl = `https://storage.googleapis.com/${bucket.name}/${fileconten.name}`

    photo = photoUrl;
  }
  // Create User
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({
    email: email,
    password: hashedPassword,
    role: 'teacher',
  });

  const savedUser = await user.save();

  // Validate school existence
  if (!schoolId) {
    throw new Error("School ID is required.");
  }
  const schoolExists = await School.findById(schoolId);
  if (!schoolExists) {
    throw new Error("School not found.");
  }
  const teacher = new Teacher({
    user: savedUser._id,
    photo: photo,
    school: schoolId, // Link teacher to a school
    ...rest
  });
  const response = await teacher.save();

  // Update the school to include the new teacher
  if (schoolId) {
    await School.findByIdAndUpdate(schoolId, { $push: { teachers: response._id } });
  }

  return {
    email,
    ...response._doc
  }
};

// Get all Teacher
const getTeachers = async (req) => {
  let query = {};
  
  // If user is a school, only get teachers from their school
  if (req.user.role === 'school') {
    const school = await School.findOne({ user: req.user.id });
    if (!school) {
      throw new Error('School not found');
    }
    query.school = school._id;
  }
  
  // If user is a teacher, only get teachers from their school
  if (req.user.role === 'teacher') {
    const teacher = await Teacher.findOne({ user: req.user.id });
    if (!teacher || !teacher.school) {
      throw new Error('Teacher not found or not assigned to a school');
    }
    query.school = teacher.school;
  }

  const teachers = await Teacher.find(query)
    .populate('user', 'email') // Populate user email
    .populate('school') // Populate school details
    .populate('classes') // Populate class details
    .populate('subTeachers'); // Populate sub-teachers details

  return teachers.map(teacher => ({
    email: teacher.user?.email,
    ...teacher._doc
  }));
};

const getTeacherById = async (id) => {
  const teacher = await Teacher.findById(id)
    .populate('user', 'email') // Populate user email
    .populate('school') // Populate school name
    .populate('classes'); // Populate class details

  if (!teacher) return null;

  return {
    email: teacher.user?.email,
    ...teacher._doc
  };
};

// Update a teacher by ID
const updateTeacher = async (id, updateData) => {
  const { email, password, ...otherUpdates } = updateData;

  // Get original teacher data
  const originalTeacher = await Teacher.findById(id).populate('user');
  if (!originalTeacher) {
    throw new Error('Teacher not found');
  }

  // Update user email and password if provided
  if (email || password) {
    const userUpdates = {};
    
    if (email) {
      // Check if email is already taken by another user
      const existingUser = await User.findOne({ 
        email: email, 
        _id: { $ne: originalTeacher.user._id } 
      });
      if (existingUser) {
        throw new Error('Email already registered');
      }
      userUpdates.email = email;
    }

    if (password) {
      userUpdates.password = await bcrypt.hash(password, 10);
    }

    // Update user
    await User.findByIdAndUpdate(originalTeacher.user._id, userUpdates);
  }

  // Update teacher data
  const updatedTeacher = await Teacher.findByIdAndUpdate(id, otherUpdates, { 
    new: true 
  }).populate('user', 'email');

  // Return the updated teacher with email
  const result = updatedTeacher.toObject();
  result.email = updatedTeacher.user?.email;
  delete result.user;
  return result;
};

// Delete a student by ID
const deleteTeacher = async (id) => {
  return await Teacher.findByIdAndDelete(id);
};

// Get teachers by school ID
const getTeachersBySchoolId = async (schoolId) => {
  // Validate school existence
  const schoolExists = await School.findById(schoolId);
  if (!schoolExists) {
    throw new Error("School not found");
  }

  // Get teachers for the school
  const teachers = await Teacher.find({ school: schoolId })
    .populate('user', 'email') // Populate user email
    .populate('classes') // Populate class details
    .populate('school'); // Populate school details

  return teachers.map(teacher => ({
    email: teacher.user?.email,
    ...teacher._doc
  }));
};

// Get teacher by class ID
const getTeacherByClassId = async (classId) => {
  // Validate class existence
  const classExists = await Class.findById(classId);
  if (!classExists) {
    throw new Error("Class not found");
  }

  // Get teacher for the class
  const teacher = await Teacher.findOne({ classes: classId })
    .populate('user', 'email')
    .populate('classes')
    .populate('school');

  if (!teacher) {
    throw new Error("No teacher found for this class");
  }

  return {
    email: teacher.user?.email,
    ...teacher._doc
  };
};

module.exports = {
  addTeacher,
  getTeacherById,
  getTeachers,
  updateTeacher,
  deleteTeacher,
  getTeachersBySchoolId,
  getTeacherByClassId
};