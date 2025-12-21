const express = require('express');
const { authenticateUser, authorizeRole, checkAuth } = require('../common/middleware/auth');
const { addBlog, getAllBlogs, getAllBlogsForAdmin, checkSlugExists, getBlogById, getBlogBySlug, getFilterOptions, getBlogAdminById, deleteBlog, updateBlog } = require('../controllers/blog.controller');
const { upload } = require('../middleware/uploadMiddleware');
const { blogSchema, updateBlogSchema } = require('../common/validations/blog.validator');
const pagination = require('../middleware/pagination');
const { validate } = require('../common/middleware/validation');
const metadata = (req, res, next) => { req.meta = { type: 'blog' }; next(); };


const router = express.Router();

// Public routes - no auth required
router.get('/check-slug/:slug', checkSlugExists);
router.get('/filter/data', getFilterOptions);

// Auth required routes
router.get('/admin',
    authenticateUser,
    authorizeRole(['super-admin', 'school', 'teacher']),
    pagination({
        defaultLimit: 5,
        maxLimit: 50,
        allowedFilters: ['category', 'author', 'visibility', 'status', 'isFeatured', 'isPinned', 'search']
    }),
    getAllBlogsForAdmin
);

router.get('/admin/:id',
    authenticateUser,
    authorizeRole(['super-admin', 'school', 'teacher']),
    getBlogAdminById
);

router.get('/slug/:slug', getBlogBySlug);

router.get('/',
    checkAuth,
    pagination({
        defaultLimit: 5,
        maxLimit: 50,
        allowedFilters: ['category', 'author', 'visibility', 'search']
    }),
    getAllBlogs
);

router.post('/',
    authenticateUser,
    authorizeRole(['super-admin']),
    metadata,
    upload.fields([
        { name: "cover", maxCount: 1 },
        { name: "images", maxCount: 10 },
        { name: "attachments", maxCount: 10 },
    ]),
    addBlog
);

router.put('/:id',
    authenticateUser,
    authorizeRole(['super-admin']),
    metadata,
    upload.fields([
        { name: "cover", maxCount: 1 },
        { name: "images", maxCount: 10 },
        { name: "attachments", maxCount: 10 },
    ]),
    updateBlog
);

router.delete('/:id',
    authenticateUser,
    authorizeRole(['super-admin']),
    deleteBlog
);

// Dynamic ID route MUST be last
router.get('/:id', getBlogById);

module.exports = router;


