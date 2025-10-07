const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    default: null,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parent',
    default: null,
  },
  content: {
    type: String,
    required: true,
  },
  upvotes: {
    type: Number,
    default: 0,
  },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Likes array
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const postSchema = new mongoose.Schema({
  author: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  tags: {
    type: [String],
    default: [],
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  upvotes: {
    type: Number,
    default: 0,
  },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Likes array
  createdAt: {
    type: Date,
    default: Date.now,
  },
  replies: [replySchema], // Embed replies directly
});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
