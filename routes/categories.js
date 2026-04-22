const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Thread = require('../models/Thread');
const { protect, adminOnly } = require('../middleware/auth');
const { generateSlug, generateUniqueSlug } = require('../utils/helpers');

// @route   GET /api/categories
// @desc    Get all categories with subcategories
// @access  Public
router.get('/', async (req, res, next) => {
  try {
    const mainCategories = await Category.find({ parent: null, isActive: true })
      .sort('order')
      .lean();

    const categoriesWithSubs = await Promise.all(
      mainCategories.map(async (cat) => {
        const subcategories = await Category.find({ parent: cat._id, isActive: true })
          .sort('order')
          .lean();
        return { ...cat, subcategories };
      })
    );

    res.json({
      success: true,
      data: categoriesWithSubs
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/categories/:slug
// @desc    Get single category with threads
// @access  Public
router.get('/:slug', async (req, res, next) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const sort = req.query.sort || '-isPinned,-lastReplyAt';
    const type = req.query.type;

    const query = { category: category._id, isDeleted: false };
    if (type) query.type = type;

    const threads = await Thread.paginate(query, {
      page,
      limit,
      sort,
      populate: [
        { path: 'author', select: 'username avatar reputation' },
        { path: 'lastReplyBy', select: 'username' }
      ]
    });

    const subcategories = await Category.find({ parent: category._id, isActive: true })
      .sort('order');

    res.json({
      success: true,
      data: {
        category,
        subcategories,
        threads: threads.docs,
        pagination: {
          total: threads.totalDocs,
          page: threads.page,
          pages: threads.totalPages,
          limit: threads.limit
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/categories
// @desc    Create category
// @access  Admin only
router.post('/', protect, adminOnly, async (req, res, next) => {
  try {
    const { name, description, parent, icon, color, order } = req.body;
    const slug = generateSlug(name);
    const uniqueSlug = await generateUniqueSlug(slug, Category);

    const category = await Category.create({
      name,
      slug: uniqueSlug,
      description,
      parent: parent || null,
      icon,
      color,
      order: order || 0
    });

    res.status(201).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/categories/:id
// @desc    Update category
// @access  Admin only
router.put('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/categories/:id
// @desc    Delete category
// @access  Admin only
router.delete('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    await Category.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Category deactivated' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
