const Post = require('../models/furom.model');
const SuperAdmin = require('../models/super-admin.model');
const Teacher = require('../models/teacher.model');
const Parent = require('../models/parent.model');
const School = require('../models/school.model');
const User = require('../models/user.model');

// Helper function to get author details based on role
async function getAuthorDetails(authorId) {
  if (!authorId) return null;

  try {
    // Try to get user role first
    const user = await User.findById(authorId);
    if (!user) return null;

    const role = user.role;

    switch (role) {
      case 'super-admin':
        const superAdmin = await SuperAdmin.findOne({ user: authorId });
        if (superAdmin) {
          return {
            firstName: superAdmin.firstName,
            lastName: superAdmin.lastName,
            photo: superAdmin.photo
          };
        }
        break;
      case 'teacher':
        const teacher = await Teacher.findOne({ user: authorId });
        if (teacher) {
          return {
            firstName: teacher.first_name,
            lastName: teacher.last_name,
            photo: teacher.photo
          };
        }
        break;
      case 'parent':
        const parent = await Parent.findOne({ user: authorId });
        if (parent) {
          return {
            firstName: parent.first_name,
            lastName: parent.last_name,
            photo: parent.profile_image
          };
        }
        break;
      case 'school':
        const school = await School.findOne({ user: authorId });
        if (school) {
          return {
            firstName: school.schoolName,
            lastName: '',
            photo: null
          };
        }
        break;
      default:
        return null;
    }
    return null;
  } catch (error) {
    console.error('Error fetching author details:', error);
    return null;
  }
}

// Helper function to format replies with author details
async function formatRepliesWithAuthorDetails(replies) {
  if (!replies || replies.length === 0) return [];

  return await Promise.all(
    replies.map(async (reply) => {
      const authorDetails = await getAuthorDetails(reply.authorId);
      return {
        ...reply.toObject(),
        author: authorDetails
      };
    })
  );
}

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
    const post = await Post.findById(postId)
      .populate('likes', 'email role')
      .populate({
        path: 'replies',
        populate: [
          { path: 'likes', select: 'email role' }
        ]
      });
    if (!post) throw new Error('Post not found');

    // Format post with author details and replies with author details
    const postObj = post.toObject();
    const postAuthorDetails = await getAuthorDetails(postObj.authorId);
    postObj.author = postAuthorDetails;
    postObj.replies = await formatRepliesWithAuthorDetails(post.replies);

    return postObj;
  },

  async getAllPosts() {
    const posts = await Post.find()
      .populate('likes', 'email role')
      .populate({
        path: 'replies',
        populate: [
          { path: 'likes', select: 'email role' }
        ]
      })
      .sort({ createdAt: -1 });

    // Format all posts with author details and replies with author details
    return await Promise.all(
      posts.map(async (post) => {
        const postObj = post.toObject();
        const postAuthorDetails = await getAuthorDetails(postObj.authorId);
        postObj.author = postAuthorDetails;
        postObj.replies = await formatRepliesWithAuthorDetails(post.replies);
        return postObj;
      })
    );
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
    
    // Return populated post
    const populatedPost = await Post.findById(postId)
      .populate('likes', 'email role');
    return populatedPost;
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
    
    // Return populated reply with super admin details
    const populatedPost = await Post.findById(postId)
      .populate({
        path: 'replies',
        populate: [
          { path: 'likes', select: 'email role' }
        ]
      });
    
    const formattedReplies = await formatRepliesWithAuthorDetails(populatedPost.replies);
    return formattedReplies.find(r => r._id.toString() === replyId);
  },
};
