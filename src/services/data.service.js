const School = require('../models/school.model');
const Class = require('../models/class.model');
const Student = require('../models/student.model');
const Teacher = require('../models/teacher.model');

const getSchools = async (classId, req) => {
  const classExists = await School.findById(classId);

  return students.map(student => {
    const studentData = student.toObject();
    studentData.first_email = student.user?.email || '';
    delete studentData.user;
    return studentData;
  });
};

const getSchoolStudnts = async (req) => {
  let schoolQuery = {};
  let classQuery = {};

  // Role-based filtering
  if (req.user.role === 'school') {
    const school = await School.findOne({ user: req.user.id });
    if (!school) {
      throw new Error('School not found');
    }
    schoolQuery._id = school._id;
  } else if (req.user.role === 'teacher') {
    const teacher = await Teacher.findOne({ user: req.user.id });
    if (!teacher || !teacher.school) {
      throw new Error('Teacher not found or not assigned to a school');
    }
    schoolQuery._id = teacher.school;
    // Only get classes that the teacher is assigned to
    classQuery._id = { $in: teacher.classes };
  }
  // Super-admin gets all data (no additional filtering)

  const schools = await School.find(schoolQuery, { _id: 1, schoolName: 1 }).lean();

  const schoolsWithClassesAndStudents = await Promise.all(
    schools.map(async (school) => {
      const finalClassQuery = { school: school._id, ...classQuery };
      const classes = await Class.find(finalClassQuery, { _id: 1, ClassName: 1 }).lean();

      const classesWithStudents = await Promise.all(
        classes.map(async (classItem) => {
          const students = await Student.find({ class: classItem._id }, { _id: 1, first_name: 1, last_name: 1 }).lean();

          return {
            _id: classItem._id,
            name: classItem.ClassName,
            students: students.map(student => ({
              _id: student._id,
              name: `${student.first_name} ${student.last_name}`
            }))
          };
        })
      );

      return {
        _id: school._id,
        name: school.schoolName,
        classes: classesWithStudents
      };
    })
  );

  return schoolsWithClassesAndStudents;
};

const getSchoolsWithClasses = async (req) => {
  let schoolQuery = {};
  let classQuery = {};

  // Role-based filtering
  if (req.user.role === 'school') {
    const school = await School.findOne({ user: req.user.id });
    if (!school) {
      throw new Error('School not found');
    }
    schoolQuery._id = school._id;
  } else if (req.user.role === 'teacher') {
    const teacher = await Teacher.findOne({ user: req.user.id });
    if (!teacher || !teacher.school) {
      throw new Error('Teacher not found or not assigned to a school');
    }
    schoolQuery._id = teacher.school;
    // Only get classes that the teacher is assigned to
    classQuery._id = { $in: teacher.classes };
  }
  // Super-admin gets all data (no additional filtering)

  const schools = await School.find(schoolQuery, { _id: 1, schoolName: 1 }).lean();

  const schoolsWithClasses = await Promise.all(
    schools.map(async (school) => {
      const finalClassQuery = { school: school._id, ...classQuery };
      const classes = await Class.find(finalClassQuery, { _id: 1, ClassName: 1 }).lean();
      return {
        _id: school._id,
        name: school.schoolName,
        classes: classes,
      };
    })
  );

  return schoolsWithClasses;
};

module.exports = {
  getSchools,
  getSchoolsWithClasses,
  getSchoolStudnts
};


