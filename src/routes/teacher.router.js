const express = require('express');
const teacherController = require('../controllers/teacher.controller');
const { validate } = require('../common/middleware/validation');
const { teacherSchema, updateTeacherSchema } = require('../common/validations/teacher.validator');
const { authenticateUser, authorizeRole } = require('../common/middleware/auth');

const multer = require('multer');

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB limit
  }
});

// Apply authentication to all routes
router.use(authenticateUser);

// Add a new teacher (only school can add teachers to their school)
router.post('/', authorizeRole(['super-admin', 'school']), upload.single('photo'), validate(teacherSchema), teacherController.addTeacher);

// Get all teachers (school can see their teachers, super-admin can see all)
router.get('/', authorizeRole(['super-admin', 'school']), teacherController.getTeachers);

// Get teachers by school ID (school can see their teachers, super-admin can see all)
router.get('/school/:schoolId', authorizeRole(['super-admin', 'school']), teacherController.getTeachersBySchool);

// Get teacher by class ID (school can see their teachers, teacher can see their colleagues)
router.get('/class/:classId', authorizeRole(['super-admin', 'school', 'teacher']), teacherController.getTeacherByClass);

// Get a single teacher (school can see their teachers, teacher can see their colleagues)
router.get('/:id', authorizeRole(['super-admin', 'school', 'teacher']), teacherController.getTeacherById);

// Update a teacher (school can update their teachers, teacher can update their own info)
router.put('/:id', authorizeRole(['super-admin', 'school', 'teacher']), upload.single('photo'),
  // validate(updateTeacherSchema),
  teacherController.updateTeacher);



// Delete a teacher (only school can delete their teachers)
router.delete('/:id', authorizeRole(['super-admin', 'school']), teacherController.deleteTeacher);

module.exports = router;