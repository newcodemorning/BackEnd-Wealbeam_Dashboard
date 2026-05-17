const express = require('express');
const responseController = require('../controllers/response.controller');
const { validate } = require('../common/middleware/validation');
const { responseSchema } = require('../common/validations/response.validator');
const { authenticateUser, authorizeRole } = require('../common/middleware/auth');

const router = express.Router();

router.use(authenticateUser);

// Submit a form response
router.post('/submit', authorizeRole(['student']), validate(responseSchema), responseController.submitFormResponse);




// School response statistics (per-class forms: Class.Subject === Form.subject). Default: today.
// Query: period=today|weekly|monthly|3months|6months|yearly
// Custom range: fromDay=YYYY-MM-DD&toDay=YYYY-MM-DD (overrides period)
router.get('/:id', authorizeRole(['super-admin', 'school', 'teacher', 'parent']), responseController.getSchoolResponsesStatistics);



// Get all responses for school by date range - daily
router.get('/daily/:id', authorizeRole(['super-admin', 'school', 'teacher', 'parent']), responseController.getSchoolResponsesStatisticsDaily);



// Get all responses for school by date range - daily (POST to allow optional note in body)
router.post('/daily/pdf/:id', authorizeRole(['super-admin', 'school', 'teacher', 'parent']), responseController.getSchoolResponsesStatisticsDailyPDF);



// Get all responses for a student (by studentId) with averageMood, status, change (vs previous submission)
// Optional query: status=green|yellow|red
// Optional date: fromDay=YYYY-MM-DD — that day only; fromDay + toDay — inclusive range
// Pagination: page (default 1), limit (default 10, max 100)
router.get(
    '/student-responses/:studentId',
    authorizeRole(['super-admin', 'school', 'teacher', 'parent', 'student']),
    responseController.getStudentResponses
);

// Monthly + yearly average mood for one student (query: year=YYYY, optional — defaults to current year)
router.get(
    '/student-monthly-average-mood/:studentId',
    authorizeRole(['super-admin', 'school', 'teacher', 'parent', 'student']),
    responseController.getStudentMonthlyAverageMood
);

// Get student status (school can see their students' status, teacher can see their students' status, parent can see their children's status)
// TODO: enhance and fix errors
router.get('/student-status/:studentId', authorizeRole(['super-admin', 'school', 'teacher', 'parent']), responseController.getStudentStatus);


// Compare student answers between two specific days — generate PDF report
// Query params: day1=YYYY-MM-DD&day2=YYYY-MM-DD
router.get('/student-status-compare/pdf/:studentId', authorizeRole(['super-admin', 'school', 'teacher', 'parent']), responseController.getStudentStatusCompareTwoDaysPDF);


// Compare student answers between two specific days
// Query params: day1=YYYY-MM-DD&day2=YYYY-MM-DD
router.get('/student-status-compare/:studentId', authorizeRole(['super-admin', 'school', 'teacher', 'parent']), responseController.getStudentStatusCompareTwoDays);


// Get all students status for a school with detailed school, classes, and students information
router.get('/school-students-status/:id', authorizeRole(['super-admin', 'school', 'teacher']), responseController.getSchoolStudentsStatus);


// Get all students status for a class with detailed school, class, and students information
router.get('/class-students-status/:id', authorizeRole(['super-admin', 'school', 'teacher']), responseController.getClassStudentsStatus);


// Get all students status for a school as PDF report (POST to allow optional note in body)
router.post('/school-students-status/pdf/:id', authorizeRole(['super-admin', 'school', 'teacher']), responseController.getSchoolStudentsStatusPDF);


// Get all students status for a class as PDF report (POST to allow optional note in body)
router.post('/class-students-status/pdf/:id', authorizeRole(['super-admin', 'school', 'teacher']), responseController.getClassStudentsStatusPDF);


// Get exam summary for a school (JSON) — per-question stats with average status
router.get('/school-exam-summary/:id', authorizeRole(['super-admin', 'school', 'teacher']), responseController.getSchoolExamSummary);

// Generate school exam summary PDF report
router.post('/school-exam-summary/pdf/:id', authorizeRole(['super-admin', 'school', 'teacher']), responseController.getSchoolExamSummaryPDF);

// Get exam summary for a class (JSON) — per-question stats with average status
router.get('/class-exam-summary/:id', authorizeRole(['super-admin', 'school', 'teacher']), responseController.getClassExamSummary);

// Generate class exam summary PDF report
router.post('/class-exam-summary/pdf/:id', authorizeRole(['super-admin', 'school', 'teacher']), responseController.getClassExamSummaryPDF);


module.exports = router;