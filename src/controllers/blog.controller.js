const { valid } = require('joi');
const BlogService = require('../services/blog.service');

const getAllBlogs = async (req, res) => {
  try {
    const lang = req.lang || 'en';
    const { page, limit, skip, sort, filter } = req.pagination;
    const total = await BlogService.countBlogs(filter);
    const blogs = await BlogService.getAllBlogs(lang, filter, skip, limit, sort);
    res.status(200).json({
      success: true,
      page,
      limit,
      total,
      pageCount: Math.ceil(total / limit),
      nextPage: page < Math.ceil(total / limit) ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null,
      data: blogs,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllBlogsForAdmin = async (req, res) => {
  try {
    const lang = req.lang || 'en';
    const { page, limit, skip, sort, filter } = req.pagination;
    const total = await BlogService.countBlogs(filter);
    const blogs = await BlogService.getAdminBlogs(lang, filter, skip, limit, sort);
    res.status(200).json({
      success: true,
      page,
      limit,
      total,
      pageCount: Math.ceil(total / limit),
      nextPage: page < Math.ceil(total / limit) ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null,
      data: blogs,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const addBlog = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'User authentication required' });
    }
    const cover = req.files?.cover?.[0]?.relativePath || null;
    const images = req.files?.images ? req.files.images.map(file => file.relativePath) : [];
    const attachments = req.files?.attachments ? req.files.attachments.map(file => file.relativePath) : [];
    const titleAr = req.body.title?.ar || '';
    const titleEn = req.body.title?.en || '';
    const contentAr = req.body.content?.ar || '';
    const contentEn = req.body.content?.en || '';
    const slug = req.body.slug;
    const tags = req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : [];
    const category = req.body.category?.trim() || "";
    const subcategory = req.body.subcategory?.trim() || "";
    const author = req.user.id;
    const visibility = (req.body.visibility || "public").trim();
    const allowedSchools = req.body.allowedSchools ? req.body.allowedSchools.split(',').map(school => school.trim()) : [];
    const status = (req.body.status || "published").trim();
    const isFeatured = req.body.isFeatured === 'true';
    const isPinned = req.body.isPinned === 'true';

    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(slug)) {
      return res.status(400).json({ success: false, message: 'Invalid slug format , it should only contain lowercase letters, numbers, and hyphens' });
    }

    const blogData = {
      title: { en: titleEn, ar: titleAr },
      content: { en: contentEn, ar: contentAr },
      cover,
      images,
      attachments,
      slug,
      tags,
      category,
      subcategory,
      author,
      visibility,
      allowedSchools,
      status,
      isFeatured,
      isPinned,
    };

    const newBlog = await BlogService.addBlog(blogData);
    res.status(201).json({ success: true, data: newBlog });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }

}

const checkSlugExists = async (req, res) => {
  try {
    const { slug } = req.params;
    const exists = await BlogService.checkSlugExists(slug);
    res.status(200).json({ success: true, valid: !exists });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getBlogById = async (req, res) => {
  try {
    const { id } = req.params;
    const lang = req.lang || 'en';
    const blog = await BlogService.getBlogById(id, lang);
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }
    res.status(200).json({ success: true, data: blog });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

const getBlogBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const lang = req.lang || 'en';
    const blog = await BlogService.getBlogBySlug(slug, lang);
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }
    res.status(200).json({ success: true, data: blog });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

const deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedBlog = await BlogService.deleteBlog(id);
    if (!deletedBlog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }
    res.status(200).json({ success: true, message: 'Blog deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateBlog = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'User authentication required' });
    }

    const { id } = req.params;

    // Prepare file updates
    const newFiles = {};

    if (req.files?.cover?.[0]) {
      newFiles.cover = req.files.cover[0].relativePath;
    }

    if (req.files?.images) {
      newFiles.images = req.files.images.map(file => file.relativePath);
    }

    if (req.files?.attachments) {
      newFiles.attachments = req.files.attachments.map(file => file.relativePath);
    }

    // Prepare update data
    const updateData = {};

    if (req.body.title) {
      updateData.title = {
        en: req.body.title?.en || '',
        ar: req.body.title?.ar || ''
      };
    }

    if (req.body.content) {
      updateData.content = {
        en: req.body.content?.en || '',
        ar: req.body.content?.ar || ''
      };
    }

    if (req.body.slug) {
      const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
      if (!slugRegex.test(req.body.slug)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid slug format, it should only contain lowercase letters, numbers, and hyphens'
        });
      }

      // Check if slug already exists (excluding current blog)
      const existingBlog = await BlogService.getBlogById(id);
      if (existingBlog.slug !== req.body.slug) {
        const slugExists = await BlogService.checkSlugExists(req.body.slug);
        if (slugExists) {
          return res.status(400).json({
            success: false,
            message: 'Slug already exists'
          });
        }
      }
      updateData.slug = req.body.slug;
    }

    if (req.body.tags) {
      updateData.tags = req.body.tags.split(',').map(tag => tag.trim());
    }

    if (req.body.category !== undefined) {
      updateData.category = req.body.category.trim();
    }

    if (req.body.subcategory !== undefined) {
      updateData.subcategory = req.body.subcategory.trim();
    }

    if (req.body.visibility) {
      updateData.visibility = req.body.visibility.trim();
    }

    if (req.body.allowedSchools) {
      updateData.allowedSchools = req.body.allowedSchools.split(',').map(school => school.trim());
    }

    if (req.body.status) {
      updateData.status = req.body.status.trim();
    }

    if (req.body.isFeatured !== undefined) {
      updateData.isFeatured = req.body.isFeatured === 'true';
    }

    if (req.body.isPinned !== undefined) {
      updateData.isPinned = req.body.isPinned === 'true';
    }

    const updatedBlog = await BlogService.updateBlog(id, updateData, newFiles);

    if (!updatedBlog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }

    res.status(200).json({ success: true, data: updatedBlog });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllBlogs,
  addBlog,
  getAllBlogsForAdmin,
  checkSlugExists,
  getBlogById,
  getBlogBySlug,
  deleteBlog,
  updateBlog
};