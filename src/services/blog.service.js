const { v4: uuidv4 } = require('uuid');
const Blog = require('../models/blog.model');
const { deleteFile, deleteFiles, deleteOldFiles } = require('../middleware/uploadMiddleware');
const User = require('../models/user.model');
const SuperAdmin = require('../models/super-admin.model');


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
        .select('title content cover attachments images slug tags category isFeatured isPinned  visibility ')
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

  static async countBlogs(filter, checkLogedin) {
    try {
      const visibilityFilter = checkLogedin
        ? { visibility: { $in: ['private', 'both'] } }
        : { visibility: { $in: ['public', 'both'] } };

      const combinedFilter = { ...filter, ...visibilityFilter };
      return await Blog.countDocuments(combinedFilter);
    } catch (error) {
      throw new Error(`Failed to count Blogs: ${error.message}`);
    }
  }

  static async checkSlugExists(slug) {
    try {
      const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
      if (!slugRegex.test(slug)) {
        throw new Error('Invalid slug format, it should only contain lowercase letters, numbers, and hyphens');
      }
      const blog = await Blog.findOne({ slug });
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

  static async getBlogForAdminById(blogId) {
    try {
      const blog = await Blog.findById(blogId)
        .populate('author', 'name email')
        .lean();

      return blog || null;
    } catch (error) {
      throw new Error(`Failed to get Blog for Admin by ID: ${error.message}`);
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
      const blog = await Blog.findById(blogId);
      if (!blog) {
        throw new Error('Blog not found');
      }

      const filesToDelete = [];

      if (blog.cover) filesToDelete.push(blog.cover);
      if (blog.images && blog.images.length > 0) filesToDelete.push(...blog.images);
      if (blog.attachments && blog.attachments.length > 0) filesToDelete.push(...blog.attachments);

      await Blog.findByIdAndDelete(blogId);

      if (filesToDelete.length > 0) {
        console.log(`[BLOG SERVICE] Deleting ${filesToDelete.length} files for blog ${blogId}`);
        await deleteFiles(filesToDelete);
      }

      return blog;
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

      const filesToDelete = [];

      // Handle cover update - delete old if new one provided
      if (newFiles.cover) {
        if (existingBlog.cover) {
          filesToDelete.push(existingBlog.cover);
        }
        updateData.cover = newFiles.cover;
      }

      // Handle images update - delete old ones if replacing
      if (newFiles.images && newFiles.images.length > 0) {
        if (existingBlog.images && existingBlog.images.length > 0) {
          filesToDelete.push(...existingBlog.images);
        }
        updateData.images = newFiles.images;

        // Alternative: Append new images instead of replace (uncomment if needed)
        // updateData.images = [...existingBlog.images, ...newFiles.images];
      }

      // Handle attachments update - delete old ones if replacing
      if (newFiles.attachments && newFiles.attachments.length > 0) {
        if (existingBlog.attachments && existingBlog.attachments.length > 0) {
          filesToDelete.push(...existingBlog.attachments);
        }
        updateData.attachments = newFiles.attachments;

        // Alternative: Append new attachments instead of replace (uncomment if needed)
        // updateData.attachments = [...existingBlog.attachments, ...newFiles.attachments];
      }

      // Update the blog
      const updatedBlog = await Blog.findByIdAndUpdate(blogId, updateData, { new: true, runValidators: true });

      // Delete old files after successful update
      if (filesToDelete.length > 0) {
        console.log(`[BLOG SERVICE] Deleting ${filesToDelete.length} old files for blog ${blogId}`);
        deleteFiles(filesToDelete).catch(err => {
          console.error(`[BLOG SERVICE] Error deleting old files:`, err);
          // Don't throw error here as blog update was successful
        });
      }

      return updatedBlog;
    } catch (error) {
      throw new Error(`Failed to update Blog: ${error.message}`);
    }
  }



  static async getFilterOptions() {
    try {
      const categories = await Blog.distinct('category');
      const authors = await Blog.distinct('author');
      const visibilities = await Blog.distinct('visibility');

      const filteredAuthors = authors.length > 0
        ? await SuperAdmin.find({ user: { $in: authors } })
          .select('_id firstName lastName')
          .lean()
        : [];

      return {
        categories: categories.filter(cat => cat),
        authors: filteredAuthors,
        visibilities,
      };
    } catch (error) {
      throw new Error(`Failed to get filter options: ${error.message}`);
    }
  }

}



// TODO : check logged in user for private blogs in GET by id and slug


module.exports = BlogService;