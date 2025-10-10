const express = require('express');
const questionController = require('../controllers/question.controller');
const { validate } = require('../common/middleware/validation');
const { createFormSchema, updateFormSchema } = require('../common/validations/question.validator');
const { authenticateUser, authorizeRole } = require('../common/middleware/auth');

const router = express.Router();

router.use(authenticateUser);



// Create a new form
router.post('/', authorizeRole(['super-admin', 'school']),  questionController.createForm);

// Get all forms
router.get('/', authorizeRole(['super-admin', 'school', 'teacher', 'student']), questionController.getAllForms);

// Get daily form
router.get('/daily', authorizeRole(['super-admin', 'school', 'teacher', 'student']), questionController.getDailyForm);

// Get form by subject
router.get('/:subject', authorizeRole(['super-admin', 'school', 'teacher', 'student']), questionController.getForm);




// Update form by subject
router.put('/:subject', authorizeRole(['super-admin', 'school']), validate(updateFormSchema), questionController.updateForm);

// Delete form by subject
router.delete('/:subject', authorizeRole(['super-admin', 'school']), questionController.deleteForm);

// Get form by ID
router.get('/id/:id', authorizeRole(['super-admin', 'school', 'teacher', 'student']), questionController.getFormById);

// Update form by ID
router.put('/id/:id', authorizeRole(['super-admin', 'school']), validate(updateFormSchema), questionController.updateFormById);

// Delete form by ID
router.delete('/id/:id', authorizeRole(['super-admin', 'school']), questionController.deleteFormById);






module.exports = router;