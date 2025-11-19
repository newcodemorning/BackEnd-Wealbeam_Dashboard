import Blog from '../models/blog.model';
const { v4: uuidv4 } = require('uuid');

class BlogService {

  static async getAllBlogs() {
    try {
      return await Blog.find()
    } catch (error) {
      throw new Error(`Failed to get Blogs: ${error.message}`);
    }
  }

 


  
}

module.exports = BlogService;