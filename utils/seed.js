const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/database');
const User = require('./models/User');
const Category = require('./models/Category');

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    await User.deleteMany({});
    await Category.deleteMany({});

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await User.create({
      username: 'admin',
      email: 'admin@bestapp.com',
      password: adminPassword,
      role: 'admin',
      reputation: 9999
    });

    console.log('✅ Admin user created');
    console.log('   Email: admin@bestapp.com');
    console.log('   Password: admin123');

    // Create default categories (Mobilism-like)
    const categories = [
      {
        name: 'Android Applications',
        slug: 'android-applications',
        description: 'Download Android APK files',
        icon: 'smartphone',
        color: '#3ddc84',
        order: 1
      },
      {
        name: 'Android Games',
        slug: 'android-games',
        description: 'Download Android games',
        icon: 'gamepad',
        color: '#ff6b6b',
        order: 2
      },
      {
        name: 'eBooks',
        slug: 'ebooks',
        description: 'Download eBooks and digital publications',
        icon: 'book',
        color: '#4ecdc4',
        order: 3
      },
      {
        name: 'Magazines',
        slug: 'magazines',
        description: 'Download digital magazines',
        icon: 'newspaper',
        color: '#ffe66d',
        order: 4
      },
      {
        name: 'Requests',
        slug: 'requests',
        description: 'Request apps, games, books or magazines',
        icon: 'help-circle',
        color: '#a8e6cf',
        order: 5
      },
      {
        name: 'Off-Topic',
        slug: 'off-topic',
        description: 'General discussions',
        icon: 'message-circle',
        color: '#ff8b94',
        order: 6
      }
    ];

    // Create main categories
    const androidApps = await Category.create(categories[0]);
    const androidGames = await Category.create(categories[1]);
    const ebooks = await Category.create(categories[2]);
    const magazines = await Category.create(categories[3]);
    const requests = await Category.create(categories[4]);
    const offtopic = await Category.create(categories[5]);

    console.log('✅ Main categories created');

    // Subcategories for Android Apps
    await Category.insertMany([
      { name: 'Communication', slug: 'communication', parent: androidApps._id, order: 1, icon: 'message-square' },
      { name: 'Education', slug: 'education', parent: androidApps._id, order: 2, icon: 'graduation-cap' },
      { name: 'Entertainment', slug: 'entertainment', parent: androidApps._id, order: 3, icon: 'film' },
      { name: 'Finance', slug: 'finance', parent: androidApps._id, order: 4, icon: 'dollar-sign' },
      { name: 'Health & Fitness', slug: 'health-fitness', parent: androidApps._id, order: 5, icon: 'heart' },
      { name: 'Music & Audio', slug: 'music-audio', parent: androidApps._id, order: 6, icon: 'music' },
      { name: 'Photography', slug: 'photography', parent: androidApps._id, order: 7, icon: 'camera' },
      { name: 'Productivity', slug: 'productivity', parent: androidApps._id, order: 8, icon: 'briefcase' },
      { name: 'Social', slug: 'social', parent: androidApps._id, order: 9, icon: 'users' },
      { name: 'Tools', slug: 'tools', parent: androidApps._id, order: 10, icon: 'tool' }
    ]);

    // Subcategories for Games
    await Category.insertMany([
      { name: 'Action', slug: 'action', parent: androidGames._id, order: 1, icon: 'zap' },
      { name: 'Adventure', slug: 'adventure', parent: androidGames._id, order: 2, icon: 'compass' },
      { name: 'Arcade', slug: 'arcade', parent: androidGames._id, order: 3, icon: 'target' },
      { name: 'Board', slug: 'board', parent: androidGames._id, order: 4, icon: 'grid' },
      { name: 'Card', slug: 'card', parent: androidGames._id, order: 5, icon: 'layers' },
      { name: 'Casino', slug: 'casino', parent: androidGames._id, order: 6, icon: 'diamond' },
      { name: 'Casual', slug: 'casual', parent: androidGames._id, order: 7, icon: 'smile' },
      { name: 'Puzzle', slug: 'puzzle', parent: androidGames._id, order: 8, icon: 'puzzle' },
      { name: 'Racing', slug: 'racing', parent: androidGames._id, order: 9, icon: 'flag' },
      { name: 'Role Playing', slug: 'role-playing', parent: androidGames._id, order: 10, icon: 'shield' },
      { name: 'Simulation', slug: 'simulation', parent: androidGames._id, order: 11, icon: 'box' },
      { name: 'Sports', slug: 'sports', parent: androidGames._id, order: 12, icon: 'activity' },
      { name: 'Strategy', slug: 'strategy', parent: androidGames._id, order: 13, icon: 'map' }
    ]);

    // Subcategories for eBooks
    await Category.insertMany([
      { name: 'Fiction', slug: 'fiction', parent: ebooks._id, order: 1, icon: 'book-open' },
      { name: 'Non-Fiction', slug: 'non-fiction', parent: ebooks._id, order: 2, icon: 'book-open' },
      { name: 'Comics', slug: 'comics', parent: ebooks._id, order: 3, icon: 'image' },
      { name: 'Academic', slug: 'academic', parent: ebooks._id, order: 4, icon: 'award' },
      { name: 'Technical', slug: 'technical', parent: ebooks._id, order: 5, icon: 'cpu' }
    ]);

    // Subcategories for Magazines
    await Category.insertMany([
      { name: 'Technology', slug: 'technology', parent: magazines._id, order: 1, icon: 'cpu' },
      { name: 'Lifestyle', slug: 'lifestyle', parent: magazines._id, order: 2, icon: 'coffee' },
      { name: 'News', slug: 'news', parent: magazines._id, order: 3, icon: 'globe' },
      { name: 'Science', slug: 'science', parent: magazines._id, order: 4, icon: 'flask' }
    ]);

    console.log('✅ Subcategories created');
    console.log('\n🎉 Seed data created successfully!');
    console.log('\n📝 Default Admin Credentials:');
    console.log('   Email: admin@bestapp.com');
    console.log('   Password: admin123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
};

seedData();
