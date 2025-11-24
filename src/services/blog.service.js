const { v4: uuidv4 } = require('uuid');
const Blog = require('../models/blog.model');

class BlogService {

  static async getAllBlogs() {
    try {
      return await Blog.find()
    } catch (error) {
      throw new Error(`Failed to get Blogs: ${error.message}`);
    }
  }

  static async addBlog(blogData) {
    try {
      const newBlog = new Blog(blogData);
      return await newBlog.save();
    } catch (error) {
      throw new Error(`Failed to add Blog: ${error.message}`);
    }
  }

}

module.exports = BlogService;