const forumRepository = require('../repositories/forum.repository');

module.exports = {
  async createPost(author, content, category) {
    const postData = {
      author,
      content,
      createdAt: new Date(),
      category,
      upvotes: 0,
      likes: [],
    };
    return await forumRepository.createPost(postData);
  },

  async addReply(postId, parentId, author, content, upvotes) {
    const replyData = {
      parentId: parentId || null,
      author,
      content,
      createdAt: new Date(),
      upvotes,
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
