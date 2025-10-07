const express = require('express');
const contactsController = require('../controllers/contacts.controller');
const { validate } = require('../common/middleware/validation');
const { contactsSchema } = require('../common/validations/contact.validator');
const { authenticateUser, authorizeRole } = require('../common/middleware/auth');

const router = express.Router();

router.use(authenticateUser, authorizeRole(["super-admin", "school", "teacher", "parent"]));
router.post('/', validate(contactsSchema), contactsController.createcontacts); // Create a post
router.get('/', contactsController.getAll); // Fetch a post with replies

module.exports = router;
