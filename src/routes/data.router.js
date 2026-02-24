const express = require('express');
const dataController = require('../controllers/data.controller');
const { validate } = require('../common/middleware/validation');
const { responseSchema } = require('../common/validations/response.validator');
const { authenticateUser, authorizeRole } = require('../common/middleware/auth');


const router = express.Router();

router.use(authenticateUser);

// Get all schools with their classes (ID and name only) for filtering
router.get('/schools', authorizeRole(['super-admin', 'school', 'teacher', 'parent']), dataController.GetSchoolsFilter);
router.get('/schools/students', authorizeRole(['super-admin', 'school', 'teacher', 'parent']), dataController.GetSchoolsStudentsFilter);


module.exports = router;