const express = require('express');
const studentController = require('../controllers/student.controller');
const { validate } = require('../common/middleware/validation');
const { studentSchema, updateStudentSchema } = require('../common/validations/student.validator');
const { authenticateUser, authorizeRole } = require('../common/middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateUser);

// Create upload directories if they don't exist
const studentDataDir = path.join(__dirname, '../../uploads/students_data');
if (!fs.existsSync(studentDataDir)) {
    fs.mkdirSync(studentDataDir, { recursive: true });
}

// Configuration for CSV file upload (for student imports)
const csvUpload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv') {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files allowed'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Configuration for photo upload (for student profile)
const photoUpload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    },
    limits: {
        fileSize: 2 * 1024 * 1024 // 2MB limit for photos
    }
});

// Get all students (school can see their students, teacher can see their students)
router.get('/', authorizeRole(['super-admin', 'school', 'teacher']), studentController.getStudents);

// Export students (school can export their students, teacher can export their students)
router.get('/export', authorizeRole(['super-admin', 'school', 'teacher']), studentController.exportStudents);

// Get a single student (school can see their students, teacher can see their students, parent can see their children, student can see their own info)
router.get('/:id', authorizeRole(['super-admin', 'school', 'teacher', 'parent', 'student']), studentController.getStudentById);

// Get students by class ID (school can see their students, teacher can see their students)
router.get('/class/:classId', authorizeRole(['super-admin', 'school', 'teacher']), studentController.getStudentsByClass);

// Add a new student (school can add students, teacher can add students)
router.post('/', 
    authorizeRole(['super-admin', 'school', 'teacher']),
    photoUpload.single('photo'),
    studentController.addStudent
);

// Update a student (school can update their students, teacher can update their students, student can update their own info)
router.put('/:id', 
    authorizeRole(['super-admin', 'school', 'teacher', 'student']),
    photoUpload.single('photo'),
    // validate(updateStudentSchema),
    studentController.updateStudent
);

// Delete a student (only school can delete their students)
router.delete('/:id', authorizeRole(['super-admin', 'school']), studentController.deleteStudent);

// Import students from CSV (school can import students, teacher can import students)
router.post('/import', 
    authorizeRole(['super-admin', 'school', 'teacher']),
    csvUpload.single('csv'), 
    studentController.importStudents
);

module.exports = router;