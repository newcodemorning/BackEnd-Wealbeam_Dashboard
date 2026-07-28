const express = require('express');
const forumController = require('../controllers/forum.controller');
const { validate } = require('../common/middleware/validation');
const { postSchema, replySchema, likeSchema } = require('../common/validations/forum.validator');
const { authenticateUser, authorizeRole } = require('../common/middleware/auth');
const router = express.Router();

// Apply authentication to all routes
router.use(authenticateUser);

// Create post - restricted to specific roles only
router.post('/add-new', authorizeRole(["super-admin", "school", "teacher", "parent"]), validate(postSchema), forumController.createPost);

// Other endpoints - authenticated users only
router.post('/:postId/replies', authorizeRole(["super-admin"]), validate(replySchema), forumController.addReply);
router.get('/:postId', forumController.fetchPostWithReplies);
router.get('/', forumController.fetchPosts);
router.post('/:postId/like', validate(likeSchema), forumController.toggleLikePost); // Like/Unlike Post
router.post('/:postId/replies/:replyId/like', validate(likeSchema), forumController.toggleLikeReply); // Like/Unlike Reply

module.exports = router;
