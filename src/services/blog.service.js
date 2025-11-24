const { v4: uuidv4 } = require('uuid');
const Blog = require('../models/blog.model');

class BlogService {

  static async getAllBlogs(language) {
    try {

      const res = await Blog.find()
        .select('title content cover slug tags category isFeatured isPinned ')

      const localizedBlogs = res.map(blog => {
        return {
          ...blog.toObject(),
          title: blog.title[language] || blog.title['en'],
          content: blog.content[language] || blog.content['en'],
        };
      });

      return localizedBlogs;

    } catch (error) {
      throw new Error(`Failed to get Blogs: ${error.message}`);
    }
  }

  static async getAdminBlogs(language) {
    try {
      const res = await Blog.find()
        // .select('title content cover images slug tags category subcategory attachments author visibility allowedSchools status viewCount isFeatured isPinned createdAt updatedAt')
        .populate('author', 'name email');

      const localizedBlogs = res.map(blog => {
        return {
          ...blog.toObject(),
          title: blog.title[language] || blog.title['en'],
          content: blog.content[language] || blog.content['en'],
        };
      });

      return localizedBlogs;

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