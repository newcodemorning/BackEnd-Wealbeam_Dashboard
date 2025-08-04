const express = require('express');
const schoolController = require('../controllers/school.controller');
const { validate } = require('../common/middleware/validation');
const { schoolSchema, updateSchoolSchema } = require('../common/validations/school.validator');
const { authenticateUser, authorizeRole } = require('../common/middleware/auth')

const multer = require('multer');

const router = express.Router();

const formParser = multer().none();

router.use(authenticateUser, authorizeRole(["super-admin"]))

// CRUD Routes
router.post('/', formParser, validate(schoolSchema), schoolController.createSchool);
router.get('/', schoolController.getAllSchools);
router.get('/:id', schoolController.getSchoolById);
router.put('/:id', formParser, validate(updateSchoolSchema), schoolController.updateSchool);
router.delete('/:id', schoolController.deleteSchool);

module.exports = router;