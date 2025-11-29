const jwt = require('jsonwebtoken');
const School = require('../../models/school.model');
const Teacher = require('../../models/teacher.model');
const Class = require('../../models/class.model');
const Student = require('../../models/student.model');

const rolePermissions = {
  "super-admin": ["auth", "faqs", "forum", "contacts", "ticket", "student", "super-admin", "teacher", "school", "class", "parent"],
  "school": ["teacher", "student", "class", "parent"],
  "teacher": ["class", "student", "parent"],
  "parent": ["faqs", "forum", "contacts", "ticket"],
  "student": ["responses"],
};

const authenticateUser = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: 'Invalid token.' });
  }
};




// Middleware to check if user has access to a specific school's resources
const checkSchoolAccess = async (req, res, next) => {
  const userRole = req.user?.role;
  const userId = req.user?.id;

  if (userRole === 'super-admin') {
    return next();
  }

  try {
    // For school users, they can only access their own school's resources
    if (userRole === 'school') {
      const school = await School.findOne({ user: userId });
      if (!school) {
        return res.status(403).json({ message: 'School not found' });
      }
      req.schoolId = school._id;
      return next();
    }

    // For teachers, they can only access resources from their school
    if (userRole === 'teacher') {
      const teacher = await Teacher.findOne({ user: userId }).populate('school');
      if (!teacher || !teacher.school) {
        return res.status(403).json({ message: 'Teacher not found or not assigned to a school' });
      }
      req.schoolId = teacher.school._id;
      return next();
    }

    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error checking school access' });
  }
};

// Middleware to check if user has access to a specific resource
const checkResourceAccess = async (req, res, next) => {
  const userRole = req.user?.role;
  const userId = req.user?.id;
  const schoolId = req.schoolId;
  const resourceId = req.params.id;

  if (userRole === 'super-admin') {
    return next();
  }

  try {
    // Check access for teacher resources
    if (req.baseUrl.includes('/teachers')) {
      if (userRole === 'school') {
        const teacher = await Teacher.findOne({ _id: resourceId, school: schoolId });
        if (!teacher) {
          return res.status(403).json({ message: 'Access denied to this teacher' });
        }
      } else if (userRole === 'teacher') {
        const teacher = await Teacher.findOne({ _id: resourceId, user: userId });
        if (!teacher) {
          return res.status(403).json({ message: 'Access denied to this teacher' });
        }
      }
    }

    // Check access for class resources
    if (req.baseUrl.includes('/classes')) {
      if (userRole === 'school') {
        const classDoc = await Class.findOne({ _id: resourceId, school: schoolId });
        if (!classDoc) {
          return res.status(403).json({ message: 'Access denied to this class' });
        }
      } else if (userRole === 'teacher') {
        const classDoc = await Class.findOne({ _id: resourceId, teacher: userId });
        if (!classDoc) {
          return res.status(403).json({ message: 'Access denied to this class' });
        }
      }
    }

    // Check access for student resources
    if (req.baseUrl.includes('/students')) {
      if (userRole === 'school') {
        const student = await Student.findOne({ _id: resourceId, school: schoolId });
        if (!student) {
          return res.status(403).json({ message: 'Access denied to this student' });
        }
      } else if (userRole === 'teacher') {
        const student = await Student.findOne({
          _id: resourceId,
          classes: { $in: await Class.find({ teacher: userId }).distinct('_id') }
        });
        if (!student) {
          return res.status(403).json({ message: 'Access denied to this student' });
        }
      }
    }

    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error checking resource access' });
  }
};

// Middleware for Role-based Access
const authorizeRole = (allowedRoles) => {
  return async (req, res, next) => {
    const userRole = req.user?.role;
    if (!userRole) {
      return res.status(403).json({ message: `Forbidden: No role assigned` });
    }

    // Check if user's role is allowed
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        message: `Forbidden: Access denied for role ${userRole}`,
      });
    }

    // First check school access
    await checkSchoolAccess(req, res, (err) => {
      if (err) return next(err);

      // Then check specific resource access if needed
      if (req.params.id) {
        checkResourceAccess(req, res, next);
      } else {
        next();
      }
    });
  };
};


const checkAuth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error(error);
    req.user = null;
    next();
  }
};


module.exports = { authenticateUser, authorizeRole, checkAuth };