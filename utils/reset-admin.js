const mongoose = require('mongoose');
const User = require('./models/User');
const { hashPassword } = require('./utils/auth.js');

async function resetAdmin() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find admin user
    const admin = await User.findOne({ role: 'admin' });
    
    if (!admin) {
      console.log('No admin user found!');
      await mongoose.disconnect();
      return;
    }

    // Reset password
    const hashedPassword = await hashPassword('admin123');
    admin.password = hashedPassword;
    await admin.save();

    console.log('Admin password reset successfully!');
    console.log('Email: admin@bestapp.com');
    console.log('Password: admin123');

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

resetAdmin();
