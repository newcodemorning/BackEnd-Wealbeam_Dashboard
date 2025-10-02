const express = require('express');
const profileController = require('../controllers/profile.controller');
const { authenticateUser } = require('../common/middleware/auth');

const router = express.Router();

// Get profile based on user role
router.get('/', authenticateUser, profileController.getProfile);


// TODO : return fire email and last email 


module.exports = router; 