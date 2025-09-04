const express = require('express');
const classController = require('../controllers/class.controller');
const { validate } = require('../common/middleware/validation');
const { classSchema, updateClassSchema } = require('../common/validations/class.validator');
const { authenticateUser, authorizeRole } = require('../common/middleware/auth');
const multer = require('multer');
const pagination = require('../Middleware/pagination');

const router = express.Router();
const formParser = multer().none();

// Apply authentication to all routes
router.use(authenticateUser);

// Get all classes (school can see their classes, teacher can see their classes)
router.get('/', authorizeRole(['super-admin', 'school', 'teacher']), pagination, classController.getClasses);

// Get classes by school ID
router.get('/school/:schoolId', authorizeRole(['super-admin', 'school']), pagination, classController.getClassesBySchool);

// Get a single class by ID
router.get('/:id', authorizeRole(['super-admin', 'school', 'teacher']), classController.getClassById);

// Create a new class (only school can create classes)
router.post('/', authorizeRole(['super-admin', 'school']), formParser, classController.createClass);

// Update a class (school can update their classes, teacher can update their classes)
router.put('/:id', authorizeRole(['super-admin', 'school', 'teacher']), formParser,  classController.updateClass);

// Delete a class (only school can delete classes)
router.delete('/:id', authorizeRole(['super-admin', 'school']), classController.deleteClass);

module.exports = router;
