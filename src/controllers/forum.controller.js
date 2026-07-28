const forumService = require('../services/forum.service');

module.exports = {
  async createPost(req, res) {
    const { content } = req.body;
    const authorId = req.user.id;
    try {
      const post = await forumService.createPost(authorId, content);
      res.status(201).json({
        _id: post._id,
        authorId: post.authorId,
        content: post.content,
        createdAt: post.createdAt
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async addReply(req, res) {
    const { postId } = req.params;
    const { content } = req.body;
    const authorId = req.user.id;

    try {
      const reply = await forumService.addReply(postId, authorId, content);
      res.status(201).json({
        _id: reply._id,
        authorId: reply.authorId,
        content: reply.content,
        createdAt: reply.createdAt
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async fetchPostWithReplies(req, res) {
    const { postId } = req.params;
    try {
      const postWithReplies = await forumService.fetchPostWithReplies(postId);
      res.status(200).json(postWithReplies);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async fetchPosts(req, res) {
    try {
      const posts = await forumService.fetchPosts();
      res.status(200).json(posts);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async toggleLikePost(req, res) {
    const { postId } = req.params;
    const { userId } = req.body;

    try {
      const post = await forumService.toggleLikePost(postId, userId);
      res.status(200).json(post);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async toggleLikeReply(req, res) {
    const { postId, replyId } = req.params;
    const { userId } = req.body;

    try {
      const reply = await forumService.toggleLikeReply(postId, replyId, userId);
      res.status(200).json(reply);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};
