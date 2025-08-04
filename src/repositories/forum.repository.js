const Post = require('../models/furom.model');

module.exports = {
  async createPost(data) {
    const post = new Post(data);
    return await post.save();
  },

  async addReply(postId, reply) {
    const post = await Post.findById(postId);
    if (!post) throw new Error('Post not found');

    post.replies.push(reply);
    await post.save();

    return reply;
  },

  async fetchPostWithReplies(postId) {
    const post = await Post.findById(postId).populate('replies');
    if (!post) throw new Error('Post not found');

    return post;
  },

  async getAllPosts() {
    return await Post.find().sort({ createdAt: -1 });
  },

  // Like or Unlike a Post
  async toggleLikePost(postId, userId) {
    const post = await Post.findById(postId);
    if (!post) throw new Error('Post not found');

    const likeIndex = post.likes.indexOf(userId);
    if (likeIndex === -1) {
      post.likes.push(userId); // Like the post
    } else {
      post.likes.splice(likeIndex, 1); // Unlike the post
    }
    await post.save();
    return post;
  },

  // Like or Unlike a Reply
  async toggleLikeReply(postId, replyId, userId) {
    const post = await Post.findById(postId);
    if (!post) throw new Error('Post not found');

    const reply = post.replies.id(replyId);
    if (!reply) throw new Error('Reply not found');

    const likeIndex = reply.likes.indexOf(userId);
    if (likeIndex === -1) {
      reply.likes.push(userId); // Like the reply
    } else {
      reply.likes.splice(likeIndex, 1); // Unlike the reply
    }
    await post.save();
    return reply;
  },
};
