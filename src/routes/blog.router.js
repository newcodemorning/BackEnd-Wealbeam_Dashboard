const express = require('express');
const { authenticateUser, authorizeRole } = require('../common/middleware/auth');
const { addBlog, getAllBlogs } = require('../controllers/blog.controller');
const { upload } = require("../middleware/uploadMiddleware");
const router = express.Router(); 

router.get('/', authenticateUser, authorizeRole(['super-admin', 'school', 'teacher']), getAllBlogs);

router.post('/', authenticateUser, authorizeRole(['super-admin']),
    upload.fields([
        { name: "cover", maxCount: 1 },
        { name: "images", maxCount: 10 },
        { name: "attachments", maxCount: 10 },
    ]),
    addBlog
);

module.exports = router;