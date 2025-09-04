const express = require('express');
const superAdminController = require('../controllers/super-admin.controller');
const { validate } = require('../common/middleware/validation');
const { superAdminSchema, updateSuperAdminSchema } = require('../common/validations/super-admin.validator');
const { authenticateUser, authorizeRole } = require('../common/middleware/auth');
const multer = require('multer');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticateUser, authorizeRole(["super-admin"]));

// CRUD Routes
router.post('/', upload.none('photo'), superAdminController.createSuperAdmin); // Create Super Admin
router.get('/:id', superAdminController.getSuperAdmin); // Get a Super Admin by ID
router.put('/:id', upload.single('photo'),  superAdminController.updateSuperAdmin); // Update Super Admin personal information
router.patch('/:id/change-password', superAdminController.changePassword); // Change Super Admin password

module.exports = router;