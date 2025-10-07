const forumService = require('../services/forum.service');

module.exports = {
  async createPost(req, res) {
    const { author, content, category } = req.body;
    try {
      const post = await forumService.createPost(author, content, category);
      res.status(201).json(post);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async addReply(req, res) {
    const { postId } = req.params;
    const { parentId, author, content, upvotes } = req.body;

    try {
      const reply = await forumService.addReply(postId, parentId, author, content, upvotes);
      res.status(201).json(reply);
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
