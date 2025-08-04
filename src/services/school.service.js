const School = require('../models/school.model');
const User = require('../models/user.model');
const Teacher = require('../models/teacher.model');
const Class = require('../models/class.model');
const Student = require('../models/student.model');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

const createSchool = async (schoolData) => {
  const { email, password, teacherIds, classIds, ...rest } = schoolData;

  // Validate password
  if (!password) {
    throw new Error('Password is required.');
  }

  // Check if email already exists in User
  const existingUser = await User.findOne({ email: email });

  if (existingUser) {
    throw new Error('Email already registered.');
  }

  // Hash the password securely
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create User
  const user = new User({
    email: email,
    password: hashedPassword,
    role: 'school',
  });
  const savedUser = await user.save();

  const school = new School({
    user: savedUser._id,
    teachers: teacherIds || [], // Link teachers if provided
    classes: classIds || [], // Link classes if provided
    ...rest,
  });

  const savedSchool = await school.save();
  return {
    email,
    ...savedSchool._doc,
  };
};


const getAllSchools = async () => {
  const schools = await School.find()
    .populate('user', 'email')
    .populate('teachers') // Populate all teacher fields
    .populate('classes'); // Populate all class fields

  return schools.map(school => ({
    email: school.user?.email, // Ensure it exists before accessing
    ...school._doc
  }));
};

const getSchoolById = async (id) => {
  const school = await School.findById(id)
    .populate('user', 'email')
    .populate('teachers') // populate teachers with specific fields
    .populate('classes' ); // populate classes with specific fields

  if (!school) return null; // Handle case where school is not found

  return {
    email: school.user?.email,
    ...school._doc
  };
};

const updateSchool = async (id, updatedData) => {
  const { email, password, ...otherUpdates } = updatedData;

  // Get original school data
  const originalSchool = await School.findById(id).populate('user');
  if (!originalSchool) {
    throw new Error('School not found');
  }

  // Update user email and password if provided
  if (email || password) {
    const userUpdates = {};
    
    if (email) {
      // Check if email is already taken by another user
      const existingUser = await User.findOne({ 
        email: email, 
        _id: { $ne: originalSchool.user._id } 
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
    await User.findByIdAndUpdate(originalSchool.user._id, userUpdates);
  }

  // Update school data
  const updatedSchool = await School.findByIdAndUpdate(id, otherUpdates, { 
    new: true 
  }).populate('user', 'email');

  // Return the updated school with email
  const result = updatedSchool.toObject();
  result.email = updatedSchool.user?.email;
  delete result.user;
  return result;
};

const deleteSchool = async (id) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Find the school and populate all related data
    const schoolToDelete = await School.findById(id)
      .populate({
        path: 'classes',
        populate: {
          path: 'students',
          select: 'user _id'
        }
      })
      .populate('teachers', 'user _id')
      .session(session);

    if (!schoolToDelete) {
      throw new Error('School not found');
    }

    // Collect all IDs for bulk operations
    const classIds = schoolToDelete.classes.map(c => c._id);
    const teacherIds = schoolToDelete.teachers.map(t => t._id);
    
    // Get all student IDs and user IDs from classes
    const studentIds = schoolToDelete.classes.reduce((acc, class_) => {
      return acc.concat(class_.students.map(s => s._id));
    }, []);
    
    const studentUserIds = schoolToDelete.classes.reduce((acc, class_) => {
      return acc.concat(class_.students.filter(s => s.user).map(s => s.user));
    }, []);

    // Get teacher user IDs
    const teacherUserIds = schoolToDelete.teachers
      .filter(t => t.user)
      .map(t => t.user);

    // Get school user ID
    const schoolUserId = schoolToDelete.user;

    // Perform bulk deletions and updates
    if (studentIds.length > 0) {
      // Delete all students in bulk
      await Student.deleteMany(
        { _id: { $in: studentIds } },
        { session }
      );

      // Delete all student user accounts
      if (studentUserIds.length > 0) {
        await User.deleteMany(
          { _id: { $in: studentUserIds } },
          { session }
        );
      }

      // Update parent documents to remove student references
      await Parent.updateMany(
        { students: { $in: studentIds } },
        { $pull: { students: { $in: studentIds } } },
        { session }
      );
    }

    // Delete all classes
    if (classIds.length > 0) {
      await Class.deleteMany(
        { _id: { $in: classIds } },
        { session }
      );
    }

    // Delete all teachers and their user accounts
    if (teacherIds.length > 0) {
      await Teacher.deleteMany(
        { _id: { $in: teacherIds } },
        { session }
      );

      if (teacherUserIds.length > 0) {
        await User.deleteMany(
          { _id: { $in: teacherUserIds } },
          { session }
        );
      }
    }

    // Delete the school's user account
    if (schoolUserId) {
      await User.findByIdAndDelete(schoolUserId, { session });
    }

    // Finally delete the school
    await School.findByIdAndDelete(id, { session });

    await session.commitTransaction();
    return { message: 'School and all associated data deleted successfully' };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

module.exports = {
  createSchool,
  getAllSchools,
  getSchoolById,
  updateSchool,
  deleteSchool
};
