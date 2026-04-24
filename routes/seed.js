const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const Category = require('../models/Category');
const { hashPassword } = require('../utils/auth.js');
const { protect, adminOnly } = require('../middleware/auth');

// @route   POST /api/seed
// @desc    Seed database with default admin and categories
// @access  Public (only works if no admin exists)
router.post('/', async (req, res, next) => {
  try {
    // Check if admin already exists
    const adminExists = await User.findOne({ role: 'admin' });

    if (adminExists) {
      // Always reset admin password when seed is called
      const hashedPassword = await hashPassword('admin123');
      adminExists.password = hashedPassword;
      adminExists.isVerified = true;
      adminExists.isActive = true;
      await adminExists.save();

      console.log('Admin password reset:', adminExists.email);

      return res.json({
        success: true,
        message: 'Admin password reset successfully!',
        data: {
          admin: {
            email: adminExists.email,
            password: 'admin123'
          }
        }
      });
    }

    // Create admin user
    const hashedPassword = await hashPassword('admin123');
    const admin = await User.create({
      username: 'admin',
      name: 'Administrator',
      email: 'admin@bestapp.com',
      password: hashedPassword,
      role: 'admin',
      reputation: 1000,
      isVerified: true,
      isActive: true
    });

    console.log('Admin user created:', admin.email);

    // Create main categories
    const categories = [
      {
        name: 'Android Applications',
        description: 'Free Android apps, tools, and utilities',
        icon: 'apps',
        color: '#3b82f6',
        order: 1,
        subcategories: [
          { name: 'Social & Communication', icon: 'users', color: '#10b981' },
          { name: 'Media & Video', icon: 'video', color: '#8b5cf6' },
          { name: 'Tools & Utilities', icon: 'tool', color: '#f59e0b' },
          { name: 'Launchers & Themes', icon: 'palette', color: '#ec4899' },
          { name: 'Productivity', icon: 'briefcase', color: '#06b6d4' }
        ]
      },
      {
        name: 'Android Games',
        description: 'Free Android games - action, puzzle, strategy & more',
        icon: 'gamepad',
        color: '#ef4444',
        order: 2,
        subcategories: [
          { name: 'Action & Adventure', icon: 'sword', color: '#dc2626' },
          { name: 'Puzzle & Brain', icon: 'puzzle', color: '#7c3aed' },
          { name: 'Racing & Sports', icon: 'car', color: '#2563eb' },
          { name: 'Strategy & Simulation', icon: 'chess', color: '#059669' }
        ]
      },
      {
        name: 'eBooks',
        description: 'Free eBooks in ePub, PDF, MOBI formats',
        icon: 'book',
        color: '#8b5cf6',
        order: 3,
        subcategories: [
          { name: 'Fiction & Literature', icon: 'book-open', color: '#a855f7' },
          { name: 'Non-Fiction & Educational', icon: 'graduation-cap', color: '#0891b2' },
          { name: 'Comics & Manga', icon: 'comic', color: '#f97316' },
          { name: 'Technical & Programming', icon: 'code', color: '#6366f1' }
        ]
      },
      {
        name: 'Magazines',
        description: 'Free magazines - tech, lifestyle, news & more',
        icon: 'newspaper',
        color: '#f59e0b',
        order: 4,
        subcategories: [
          { name: 'Technology', icon: 'cpu', color: '#3b82f6' },
          { name: 'Lifestyle & Fashion', icon: 'heart', color: '#ec4899' },
          { name: 'News & Business', icon: 'globe', color: '#14b8a6' }
        ]
      },
      {
        name: 'Requests',
        description: 'Request apps, games, books or other content',
        icon: 'message-question',
        color: '#64748b',
        order: 5,
        subcategories: [
          { name: 'App Requests', icon: 'apps', color: '#64748b' },
          { name: 'Game Requests', icon: 'gamepad', color: '#64748b' },
          { name: 'Book Requests', icon: 'book', color: '#64748b' }
        ]
      },
      {
        name: 'Off-Topic',
        description: 'General discussions and everything else',
        icon: 'coffee',
        color: '#14b8a6',
        order: 6,
        subcategories: [
          { name: 'General Chat', icon: 'message', color: '#14b8a6' },
          { name: 'Tech Support', icon: 'headset', color: '#0ea5e9' },
          { name: 'Feedback & Suggestions', icon: 'lightbulb', color: '#eab308' }
        ]
      }
    ];

    // Create categories with subcategories
    for (const catData of categories) {
      const { subcategories, ...mainCat } = catData;
      
      // Create main category
      const mainCategory = await Category.create({
        ...mainCat,
        slug: mainCat.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '')
      });

      // Create subcategories
      for (const subcat of subcategories) {
        await Category.create({
          name: subcat.name,
          slug: `${mainCategory.slug}-${subcat.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '')}`,
          description: `${subcat.name} discussions`,
          icon: subcat.icon,
          color: subcat.color,
          parent: mainCategory._id,
          order: subcategories.indexOf(subcat)
        });
      }

      console.log(`Created category: ${mainCategory.name}`);
    }

    res.json({
      success: true,
      message: 'Database seeded successfully!',
      data: {
        admin: {
          email: admin.email,
          password: 'admin123 (changed on first login recommended)'
        },
        categories: categories.length,
        totalCategories: await Category.countDocuments()
      }
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
