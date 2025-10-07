const express = require('express');
const faqController = require('../controllers/faq.controller');
const { validate } = require('../common/middleware/validation');
const { faqSchema, updateFaqSchema } = require('../common/validations/faq.validator');
const { authenticateUser, authorizeRole } = require('../common/middleware/auth');
const router = express.Router();


router.use(authenticateUser, authorizeRole(["super-admin", "school", "teacher", "parent"]));
// Create a new FAQ
router.post('/', validate(faqSchema), faqController.createFq);

// Get all FAQs
router.get('/', faqController.getAllFqs);

// // Get an FAQ by ID
// router.get('/:id', faqController.getFaqById);

// Update an FAQ by ID
router.put('/:id', validate(updateFaqSchema), faqController.updateFq);

// Delete an FAQ by ID
router.delete('/:id', faqController.deleteFq);

module.exports = router;
