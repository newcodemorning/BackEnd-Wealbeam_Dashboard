const express = require('express');
const responseController = require('../controllers/response.controller');
const { validate } = require('../common/middleware/validation');
const { responseSchema } = require('../common/validations/response.validator');
const { authenticateUser, authorizeRole } = require('../common/middleware/auth');

const router = express.Router();

router.use(authenticateUser);

// Submit a form response
router.post('/submit', authorizeRole(['student']), validate(responseSchema), responseController.submitFormResponse);




// Get all responses for school (school can see their responses) by date range
router.get('/:id', authorizeRole(['super-admin', 'school', 'teacher', 'parent']), responseController.getSchoolResponsesStatistics);



// Get all responses for school by date range - daily
router.get('/daily/:id', authorizeRole(['super-admin', 'school', 'teacher', 'parent']), responseController.getSchoolResponsesStatisticsDaily);



// Get all responses for school by date range - daily
router.get('/daily/pdf/:id', authorizeRole(['super-admin', 'school', 'teacher', 'parent']), responseController.getSchoolResponsesStatisticsDailyPDF);



// Get student status (school can see their students' status, teacher can see their students' status, parent can see their children's status)
// TODO: enhance and fix errors
router.get('/student-status/:studentId', authorizeRole(['super-admin', 'school', 'teacher', 'parent']), responseController.getStudentStatus);


// Get all students status for a school with detailed school, classes, and students information
router.get('/school-students-status/:id', authorizeRole(['super-admin', 'school', 'teacher']), responseController.getSchoolStudentsStatus);


// Get all students status for a school as PDF report
router.get('/school-students-status/pdf/:id', authorizeRole(['super-admin', 'school', 'teacher']), responseController.getSchoolStudentsStatusPDF);


// Get all students status for a class as PDF report
router.get('/class-students-status/pdf/:id', authorizeRole(['super-admin', 'school', 'teacher']), responseController.getClassStudentsStatusPDF);

// // Get all responses for a subject (school can see their responses, teacher can see their responses)
// router.get('/subject/:subject', authorizeRole(['super-admin', 'school', 'teacher']), responseController.getSubjectResponses);

// // Get a single response (school can see their responses, teacher can see their responses, parent can see their children's responses)
// router.get('/:id', authorizeRole(['super-admin', 'school', 'teacher', 'parent']), responseController.getResponse);

module.exports = router; 