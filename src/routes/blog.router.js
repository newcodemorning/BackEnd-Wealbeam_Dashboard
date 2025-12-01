const express = require('express');
const { authenticateUser, authorizeRole, checkAuth } = require('../common/middleware/auth');
const { addBlog, getAllBlogs, getAllBlogsForAdmin, checkSlugExists, getBlogById, getBlogBySlug, deleteBlog, updateBlog } = require('../controllers/blog.controller');
const { upload } = require('../middleware/uploadMiddleware');
const { blogSchema, updateBlogSchema } = require('../common/validations/blog.validator');
const pagination = require('../middleware/pagination');
const { validate } = require('../common/middleware/validation');
const metadata = (req, res, next) => { req.meta = { type: 'blog' }; next(); };


const router = express.Router();

router.get('/',
    checkAuth,
    pagination({ defaultLimit: 5, maxLimit: 50, allowedFilters: ['category', 'author', 'visibility', 'search'] }),
    getAllBlogs);

router.get('/admin', authenticateUser,
    authorizeRole(['super-admin', 'school', 'teacher']),
    pagination({ defaultLimit: 5, maxLimit: 50, allowedFilters: ['category', 'author', 'visibility', 'search'] }),
    getAllBlogsForAdmin
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

router.get('/check-slug/:slug', checkSlugExists);
router.get('/:id', getBlogById);
router.get('/slug/:slug', getBlogBySlug);
router.delete('/:id', authenticateUser, authorizeRole(['super-admin']), deleteBlog);


module.exports = router;


