const Class = require('../models/class.model');
const School = require('../models/school.model');
const Teacher = require('../models/teacher.model');
const Student = require('../models/student.model');
const User = require('../models/user.model');
const Parent = require('../models/parent.model');
const mongoose = require('mongoose');

const createClass = async (classData) => {
  const { schoolId, teacherId, ...rest } = classData;

  // Validate school existence
  if (!schoolId) {
    throw new Error("School ID is required.");
  }
  const schoolExists = await School.findById(schoolId);
  if (!schoolExists) {
    throw new Error("School not found.");
  }

  // Validate teacher existence if provided
  let teacherExists = null;
  if (teacherId) {
    teacherExists = await Teacher.findById(teacherId);
    if (!teacherExists) {
      throw new Error("Teacher not found.");
    }
  }

  // Create the class
  const newClass = new Class({
    school: schoolId,
    teacher: teacherId || null,
    ...rest,
  });
  const savedClass = await newClass.save();

  // Update the school to include this class
  await School.findByIdAndUpdate(schoolId, {
    $addToSet: { classes: savedClass._id },
  });

  // Update the teacher to include this class if teacher exists
  if (teacherExists) {
    await Teacher.findByIdAndUpdate(teacherId, {
      $addToSet: { classes: savedClass._id },
    });
  }
  return savedClass;
};


const getAllClasses = async (req) => {
  let query = {};

  // If user is a school, only get classes from their school
  if (req.user.role === 'school') {
    const school = await School.findOne({ user: req.user.id });
    if (!school) {
      throw new Error('School not found');
    }
    query.school = school._id;
  }

  // If user is a teacher, only get classes they teach
  if (req.user.role === 'teacher') {
    const teacher = await Teacher.findOne({ user: req.user.id });
    if (!teacher || !teacher.school) {
      throw new Error('Teacher not found or not assigned to a school');
    }
    query.teacher = teacher._id;
  }

  const classes = await Class.find(query)
    .populate('school', '_id schoolName').populate('teacher', '-password').populate('subTeachers', '-password')


  const Res = classes.map(cls => {
    const classObj = cls.toObject();
    const teacherLength =
      (cls.teacher ? 1 : 0) + (cls.subTeachers ? cls.subTeachers.length : 0);
    classObj.teacherLength = teacherLength;
    const studentSize = cls.students ? cls.students.length : 0;
    classObj.studentLength = studentSize;
    classObj.mainTeacherName = {
      _id: cls.teacher?._id,
      name: cls.teacher?.first_name + ' ' + cls.teacher?.last_name
    }
    classObj.subTeacherNames = cls.subTeachers?.map(st => {
      return {
        _id: st._id,
        name: st.first_name + ' ' + st.last_name
      };
    });
    classObj.students = undefined;
    classObj.__v = undefined;
    classObj.teacher = undefined;
    classObj.subTeachers = undefined;


    return classObj;
  });

  return Res;

};

const getClassById = async (id, req) => {
  const classDoc = await Class.findById(id)
    .populate('school')
    .populate('teacher')
    .populate('students');

  if (!classDoc) {
    throw new Error('Class not found');
  }

  // Check if user has access to this class
  if (req.user.role === 'school') {
    const school = await School.findOne({ user: req.user.id });
    if (!school || classDoc.school.toString() !== school._id.toString()) {
      throw new Error('Access denied to this class');
    }
  } else if (req.user.role === 'teacher') {
    const teacher = await Teacher.findOne({ user: req.user.id });
    if (!teacher || classDoc.teacher.toString() !== teacher._id.toString()) {
      throw new Error('Access denied to this class');
    }
  }


  return classData;
};

const updateClass = async (id, updatedData) => {
  const { schoolId, teacherId, ...otherUpdates } = updatedData;

  // Get original class data
  const originalClass = await Class.findById(id);
  if (!originalClass) {
    throw new Error('Class not found');
  }

  // Handle school change
  if (schoolId && schoolId !== originalClass.school.toString()) {
    // Validate new school
    const newSchool = await School.findById(schoolId);
    if (!newSchool) {
      throw new Error('New school not found');
    }

    // Remove class from old school
    await School.findByIdAndUpdate(originalClass.school, {
      $pull: { classes: originalClass._id }
    });

    // Add class to new school
    await School.findByIdAndUpdate(schoolId, {
      $addToSet: { classes: originalClass._id }
    });

    otherUpdates.school = schoolId;
  }

  // Handle teacher change
  if (teacherId !== undefined) { // Check if teacherId is provided (can be null)
    if (teacherId === null) {
      // If teacherId is explicitly set to null, remove the teacher
      if (originalClass.teacher) {
        // Remove class from old teacher
        await Teacher.findByIdAndUpdate(originalClass.teacher, {
          $pull: { classes: originalClass._id }
        });
      }
      otherUpdates.teacher = null;
    } else {
      // Validate new teacher
      const newTeacher = await Teacher.findById(teacherId);
      if (!newTeacher) {
        throw new Error('New teacher not found');
      }

      // Remove class from old teacher if exists
      if (originalClass.teacher) {
        await Teacher.findByIdAndUpdate(originalClass.teacher, {
          $pull: { classes: originalClass._id }
        });
      }

      // Add class to new teacher
      await Teacher.findByIdAndUpdate(teacherId, {
        $addToSet: { classes: originalClass._id }
      });

      otherUpdates.teacher = teacherId;
    }
  }

  // Update class data
  const updatedClass = await Class.findByIdAndUpdate(id, otherUpdates, {
    new: true
  })
    .populate('school')
    .populate('teacher')
    .populate('students');

  return updatedClass;
};


const addTeacherToClass = async (classId, teacherId) => {
  const [classDoc, teacherDoc] = await Promise.all([
    Class.findById(classId),
    Teacher.findById(teacherId)
  ]);

  if (!classDoc) throw new Error("Class not found.");
  if (!teacherDoc) throw new Error("Teacher not found.");

  if (classDoc.subTeachers.some(id => id.toString() === teacherId.toString())) {
    throw new Error("Teacher is already assigned to this class.");
  }

  await Teacher.findByIdAndUpdate(teacherId, {
    $addToSet: { classes: classDoc._id }
  });

  classDoc.subTeachers.push(teacherId);
  await classDoc.save();

  return classDoc;
};


const removeTeacherFromClass = async (classId, teacherId) => {
  const [classDoc, teacherDoc] = await Promise.all([
    Class.findById(classId),
    Teacher.findById(teacherId)
  ]);

  if (!classDoc) throw new Error("Class not found.");
  if (!teacherDoc) throw new Error("Teacher not found.");

  if (!classDoc.subTeachers.some(id => id.toString() === teacherId.toString())) {
    throw new Error("Teacher is not assigned to this class.");
  }

  await Teacher.findByIdAndUpdate(teacherId, {
    $pull: { classes: classDoc._id }
  });

  classDoc.subTeachers = classDoc.subTeachers.filter(
    id => id.toString() !== teacherId.toString()
  );
  await classDoc.save();

  return classDoc;
};




const deleteClass = async (id) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Find the class first to get all students
    const classToDelete = await Class.findById(id)
      .populate('students', 'user _id')
      .session(session);

    if (!classToDelete) {
      throw new Error('Class not found');
    }

    // Get all student IDs and user IDs
    const studentIds = classToDelete.students.map(student => student._id);
    const userIds = classToDelete.students
      .filter(student => student.user)
      .map(student => student.user);

    // Bulk delete operations
    if (studentIds.length > 0) {
      // Delete all students in bulk
      await Student.deleteMany(
        { _id: { $in: studentIds } },
        { session }
      );

      // Delete all associated user accounts in bulk
      if (userIds.length > 0) {
        await User.deleteMany(
          { _id: { $in: userIds } },
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

    // Update school and teacher documents
    if (classToDelete.school) {
      await School.findByIdAndUpdate(
        classToDelete.school,
        { $pull: { classes: classToDelete._id } },
        { session }
      );
    }

    if (classToDelete.teacher) {
      await Teacher.findByIdAndUpdate(
        classToDelete.teacher,
        { $pull: { classes: classToDelete._id } },
        { session }
      );
    }

    // Delete the class
    await Class.findByIdAndDelete(id, { session });

    await session.commitTransaction();
    return { message: 'Class and associated students deleted successfully' };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const getClassesBySchoolId = async (schoolId) => {
  // Validate school existence
  const schoolExists = await School.findById(schoolId);
  if (!schoolExists) {
    throw new Error("School not found");
  }

  // Get classes for the school
  const classes = await Class.find({ school: schoolId })
    .populate('teacher', '-password')
    .populate('students')
    .populate('school', '-password');

  return classes;
};

module.exports = {
  createClass,
  getAllClasses,
  getClassById,
  updateClass,
  deleteClass,
  getClassesBySchoolId,
  addTeacherToClass,
  removeTeacherFromClass
};
