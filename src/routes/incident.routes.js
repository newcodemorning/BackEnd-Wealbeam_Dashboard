const express = require("express");
const incidentController = require("../controllers/incident.controller");
const { validate } = require("../common/middleware/validation");
const {
  createIncidentSchema,
} = require("../common/validations/incident.validator");
const {
  authenticateUser,
  authorizeRole,
} = require("../common/middleware/auth");

const multer = require("multer");

const router = express.Router();

const formParser = multer().none();

router.use(authenticateUser);

// Create incident
router.post(
  "/",
  authorizeRole(["super-admin", "school", "teacher"]),
  formParser,
  validate(createIncidentSchema),
  incidentController.createIncident,
);

// Get incidents for a student
router.get(
  "/student/:studentId",
  authorizeRole(["super-admin", "school", "teacher", "parent"]),
  incidentController.getStudentIncidents,
);

// Get single incident
router.get(
  "/:incidentId",
  authorizeRole(["super-admin", "school", "teacher", "parent"]),
  incidentController.getIncident,
);

// Update incident
router.put(
  "/:incidentId",
  authorizeRole(["super-admin", "school", "teacher"]),
  formParser,
  incidentController.updateIncident,
);

// Delete incident
router.delete(
  "/:incidentId",
  authorizeRole(["super-admin"]),
  incidentController.deleteIncident,
);

module.exports = router;
