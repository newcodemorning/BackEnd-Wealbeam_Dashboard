const express = require('express');
const parentController = require('../controllers/parent.controller');
const { validate } = require('../common/middleware/validation');
const { parentSchema, updateParentSchema } = require('../common/validations/parent.validator');
const { authenticateUser, authorizeRole } = require('../common/middleware/auth');
const multer = require('multer');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Apply authentication to all routes
router.use(authenticateUser);

// Add a parent (school can add parents, teacher can add parents)
router.post('/', authorizeRole(['super-admin', 'school', 'teacher']), upload.single('photo'), parentController.addParent);

// Get all parents (school can see their parents, teacher can see their parents)
router.get('/', authorizeRole(['super-admin', 'school', 'teacher']), parentController.getParents);

// Get a single parent (school can see their parents, teacher can see their parents, parent can see their own info)
router.get('/:id', authorizeRole(['super-admin', 'school', 'teacher', 'parent']), parentController.getParentById);

// Update a parent (school can update their parents, teacher can update their parents, parent can update their own info)
router.put('/:id', authorizeRole(['super-admin', 'school', 'teacher', 'parent']), parentController.updateParent);

// Delete a parent (only school can delete parents)
router.delete('/:id', authorizeRole(['super-admin', 'school']), parentController.deleteParent);

module.exports = router;
