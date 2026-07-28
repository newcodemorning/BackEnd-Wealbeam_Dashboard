const forumRepository = require('../repositories/forum.repository');

module.exports = {
  async createPost(authorId, content) {
    const postData = {
      authorId,
      content,
      createdAt: new Date(),
      tags: [],
      parentId: null,
      upvotes: 0,
      likes: [],
    };
    return await forumRepository.createPost(postData);
  },

  async addReply(postId, authorId, content) {
    const replyData = {
      parentId: null,
      authorId,
      content,
      createdAt: new Date(),
      upvotes: 0,
      likes: [],
      postId,
    };
    return await forumRepository.addReply(postId, replyData);
  },

  async fetchPostWithReplies(postId) {
    return await forumRepository.fetchPostWithReplies(postId);
  },

  async fetchPosts() {
    return await forumRepository.getAllPosts();
  },

  async toggleLikePost(postId, userId) {
    return await forumRepository.toggleLikePost(postId, userId);
  },

  async toggleLikeReply(postId, replyId, userId) {
    return await forumRepository.toggleLikeReply(postId, replyId, userId);
  },
};
