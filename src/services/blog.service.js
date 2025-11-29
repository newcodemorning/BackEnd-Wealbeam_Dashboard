const { v4: uuidv4 } = require('uuid');
const Blog = require('../models/blog.model');


class BlogService {

  static async getAllBlogs(language, filter, skip, limit, sort, checkLogedin) {
    try {
      const EnvBaseURL = process.env.ENVIRONMENT === 'production'
        ? process.env.PROD_BASE_URL
        : process.env.DEV_BASE_URL;

      const visibilityFilter = checkLogedin
        ? { visibility: { $in: ['private', 'both'] } }
        : { visibility: { $in: ['public', 'both'] } };

      const combinedFilter = { ...filter, ...visibilityFilter };

      const blogs = await Blog.find(combinedFilter)
        .select('title content cover attachments images slug tags category isFeatured isPinned')
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .lean();

      const buildURL = (path) => path && !path.startsWith('http') ? `${EnvBaseURL}/${path}` : path;
      const processedBlogs = blogs.map(blog => ({
        ...blog,
        cover: buildURL(blog.cover),
        images: Array.isArray(blog.images) ? blog.images.map(buildURL) : [],
        attachments: Array.isArray(blog.attachments) ? blog.attachments.map(buildURL) : [],
        title: blog.title[language] || blog.title['en'],
        content: blog.content[language] || blog.content['en'],
      }));
      return processedBlogs;
    } catch (error) {
      throw new Error(`Failed to get Blogs: ${error.message}`);
    }
  }



  static async getAdminBlogs(language, filter, skip, limit, sort) {
    try {
      const EnvBaseURL = process.env.ENVIRONMENT === 'production'
        ? process.env.PROD_BASE_URL
        : process.env.DEV_BASE_URL;
      const blogs = await Blog.find(filter)
        .populate('author', 'name email')
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .lean();
      const buildURL = (path) => path && !path.startsWith('http') ? `${EnvBaseURL}/${path}` : path;
      const processedBlogs = blogs.map(blog => ({
        ...blog,
        cover: buildURL(blog.cover),
        images: Array.isArray(blog.images) ? blog.images.map(buildURL) : [],
        attachments: Array.isArray(blog.attachments) ? blog.attachments.map(buildURL) : [],
        title: blog.title[language] || blog.title['en'],
        content: blog.content[language] || blog.content['en'],
      }));

      return processedBlogs;
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

  static async countBlogs(filter) {
    try {
      return await Blog.countDocuments(filter);
    } catch (error) {
      throw new Error(`Failed to count Blogs: ${error.message}`);
    }
  }

  static async checkSlugExists(slug) {
    try {
      const blog = await Blog.findOne({ slug });
      const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
      if (!slugRegex.test(slug)) {
        return res.status(400).json({ success: false, message: 'Invalid slug format , it should only contain lowercase letters, numbers, and hyphens' });
      }
      return !!blog;
    } catch (error) {
      throw new Error(`Failed to check slug existence: ${error.message}`);
    }
  }

  static async getBlogById(blogId, language) {
    try {
      const EnvBaseURL = process.env.ENVIRONMENT === 'production'
        ? process.env.PROD_BASE_URL
        : process.env.DEV_BASE_URL;

      const blog = await Blog.findById(blogId).lean();

      if (!blog) {
        return null;
      }

      this.incrementViewCount(blog._id);

      const buildURL = (path) => path && !path.startsWith('http') ? `${EnvBaseURL}/${path}` : path;

      return {
        ...blog,
        cover: buildURL(blog.cover),
        images: Array.isArray(blog.images) ? blog.images.map(buildURL) : [],
        attachments: Array.isArray(blog.attachments) ? blog.attachments.map(buildURL) : [],
        title: blog.title[language] || blog.title['en'],
        content: blog.content[language] || blog.content['en'],
      };
    } catch (error) {
      throw new Error(`Failed to get Blog by ID: ${error.message}`);
    }
  }

  static async getBlogBySlug(slug, language) {
    try {
      const EnvBaseURL = process.env.ENVIRONMENT === 'production'
        ? process.env.PROD_BASE_URL
        : process.env.DEV_BASE_URL;

      const blog = await Blog.findOne({ slug }).lean();

      if (!blog) {
        return null;
      }

      this.incrementViewCount(blog._id);

      const buildURL = (path) => path && !path.startsWith('http') ? `${EnvBaseURL}/${path}` : path;

      return {
        ...blog,
        cover: buildURL(blog.cover),
        images: Array.isArray(blog.images) ? blog.images.map(buildURL) : [],
        attachments: Array.isArray(blog.attachments) ? blog.attachments.map(buildURL) : [],
        title: blog.title[language] || blog.title['en'],
        content: blog.content[language] || blog.content['en'],
      };
    } catch (error) {
      throw new Error(`Failed to get Blog by slug: ${error.message}`);
    }
  }

  static async incrementViewCount(blogId) {
    try {
      return await Blog.findByIdAndUpdate(
        blogId,
        { $inc: { viewCount: 1 } },
        { new: true }
      );
    } catch (error) {
      throw new Error(`Failed to increment view count: ${error.message}`);
    }
  }

  static async deleteBlog(blogId) {
    try {
      return await Blog.findByIdAndDelete(blogId);
      // TODO: Add logic to remove associated files from storage if needed
    } catch (error) {
      throw new Error(`Failed to delete Blog: ${error.message}`);
    }
  }

  static async updateBlog(blogId, updateData, newFiles = {}) {
    try {
      const existingBlog = await Blog.findById(blogId);
      if (!existingBlog) {
        throw new Error('Blog not found');
      }

      // Handle file updates
      if (newFiles.cover) {
        updateData.cover = newFiles.cover;
        // TODO: Delete old cover file from storage
      }

      if (newFiles.images && newFiles.images.length > 0) {
        // Option 1: Replace all images
        updateData.images = newFiles.images;
        // TODO: Delete old image files from storage

        // Option 2: Append new images (uncomment if needed)
        // updateData.images = [...existingBlog.images, ...newFiles.images];
      }

      if (newFiles.attachments && newFiles.attachments.length > 0) {
        // Option 1: Replace all attachments
        updateData.attachments = newFiles.attachments;
        // TODO: Delete old attachment files from storage

        // Option 2: Append new attachments (uncomment if needed)
        // updateData.attachments = [...existingBlog.attachments, ...newFiles.attachments];
      }

      return await Blog.findByIdAndUpdate(blogId, updateData, { new: true, runValidators: true });
    } catch (error) {
      throw new Error(`Failed to update Blog: ${error.message}`);
    }
  }

}



// TODO : check logged in user for private blogs in GET by id and slug


module.exports = BlogService;