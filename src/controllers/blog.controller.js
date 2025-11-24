const BlogService = require('../services/blog.service');

const getAllBlogs = async (req, res) => {
  try {
    const lang = req.lang || 'en';
    const blogs = await BlogService.getAllBlogs(lang);
    res.status(200).json({ success: true, data: blogs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const addBlog = async (req, res) => {
  try {
    // Validate author
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'User authentication required' });
    }

    const uploadDir = process.env.ENVIRONMENT === "production" ? "/var/www/files" : require('path').resolve("uploads");

    // Extract relative paths by removing the uploadDir prefix
    const cover = req.files?.cover?.[0]
      ? req.files.cover[0].path.replace(uploadDir + require('path').sep, '').replace(/\\/g, '/')
      : null;

    const images = req.files?.images
      ? req.files.images.map(file => file.path.replace(uploadDir + require('path').sep, '').replace(/\\/g, '/'))
      : [];

    const attachments = req.files?.attachments
      ? req.files.attachments.map(file => file.path.replace(uploadDir + require('path').sep, '').replace(/\\/g, '/'))
      : [];

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


module.exports = { getAllBlogs, addBlog };
