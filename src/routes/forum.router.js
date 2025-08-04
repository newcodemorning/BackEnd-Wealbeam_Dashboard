const express = require('express');
const forumController = require('../controllers/forum.controller');
const { validate } = require('../common/middleware/validation');
const { postSchema, replySchema, likeSchema } = require('../common/validations/forum.validator');
const { authenticateUser, authorizeRole } = require('../common/middleware/auth');
const router = express.Router();

router.use(authenticateUser, authorizeRole(["super-admin", "school", "teacher", "parent"]));

router.post('/add-new', validate(postSchema), forumController.createPost);
router.post('/:postId/replies', validate(replySchema), forumController.addReply);
router.get('/:postId', forumController.fetchPostWithReplies);
router.get('/', forumController.fetchPosts);
router.post('/:postId/like', validate(likeSchema), forumController.toggleLikePost); // Like/Unlike Post
router.post('/:postId/replies/:replyId/like', validate(likeSchema), forumController.toggleLikeReply); // Like/Unlike Reply

module.exports = router;
