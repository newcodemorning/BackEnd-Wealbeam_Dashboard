const express = require('express');
const authController = require('../controllers/auth.controller');
const { validate } = require('../common/middleware/validation');
const { userSchema } = require('../common/validations/user.validator');
const { authenticateUser } = require('../common/middleware/auth');


const router = express.Router();


router.post('/login', authController.login);
// Change password route
router.post('/password/reset', authenticateUser, authController.changePassword);

module.exports = router;
