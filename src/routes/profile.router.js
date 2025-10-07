const express = require('express');
const profileController = require('../controllers/profile.controller');
const { authenticateUser } = require('../common/middleware/auth');
const multer = require('multer');

const router = express.Router();

// Configuration for photo upload
const photoUpload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    },
    limits: {
        fileSize: 2 * 1024 * 1024 
    }
});

// Get profile based on user role
router.get('/', authenticateUser, profileController.getProfile);
router.put('/', authenticateUser, photoUpload.single('photo'), profileController.updateProfile);

module.exports = router;