const express = require("express");
const contactsController = require("../controllers/contacts.controller");
const { validate } = require("../common/middleware/validation");
const { contactSchema } = require("../common/validations/contact.validator");
const {
  authenticateUser,
  authorizeRole,
} = require("../common/middleware/auth");

const router = express.Router();

router.use(
  authenticateUser,
  authorizeRole(["super-admin", "school", "teacher", "parent"]),
);
router.post("/", validate(contactSchema), contactsController.createcontacts); // Create a post
router.get("/", contactsController.getAll); // Fetch a post with replies

module.exports = router;
