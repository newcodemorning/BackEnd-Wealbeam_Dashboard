const BlogService = require('../services/blog.service');

const getAllBlogs = async (req, res) => {
  try {
    const blogs = await BlogService.getAllBlogs();
    res.status(200).json({ success: true, data: blogs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const addBlog = async (req, res) => {
  try {
    // Validate author
    if (!req.user || !req.user.id) {
      console.log("Authentication error: User not logged in");
      console.log(req.user);
      return res.status(401).json({ success: false, message: 'User authentication required' });
    }

    const cover = req.files?.cover?.[0]?.path || null;
    const images = req.files.images ? req.files.images.map(file => file.path) : [];
    const attachments = req.files.attachments ? req.files.attachments.map(file => file.path) : [];

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
