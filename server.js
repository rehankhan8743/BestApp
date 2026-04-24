const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const categoryRoutes = require('./routes/categories');
const threadRoutes = require('./routes/threads');
const postRoutes = require('./routes/posts');
const searchRoutes = require('./routes/search');
const uploadRoutes = require('./routes/uploads');
const seedRoutes = require('./routes/seed');

// Load env vars
require('dotenv').config();

// Connect to database
connectDB();

const app = express();

// Trust proxy for Render (behind load balancer)
app.set('trust proxy', 1); // Trust first hop proxy (Render's load balancer)

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// Rate limiting - configure for proxy environment
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { success: false, message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: true }
});
app.use('/api/', limiter);

// Stricter rate limit for auth
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: { success: false, message: 'Too many auth attempts, please try again later' }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
  // Try multiple possible paths for Render compatibility
  // Priority: root dist first (new build), then client/dist (old build)
  const possiblePaths = [
    path.join(__dirname, 'dist'),
    path.join(process.cwd(), 'dist'),
    '/opt/render/project/src/dist',
    path.join(__dirname, 'client', 'dist'),
    path.join(process.cwd(), 'client', 'dist'),
    '/opt/render/project/src/client/dist'
  ];

  let distPath = possiblePaths[0];
  const fs = require('fs');
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      distPath = p;
      break;
    }
  }

  console.log(`Serving static files from: ${distPath}`);
  app.use(express.static(distPath));
}

// API Routes
const adminRoutes = require('./routes/admin');
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/threads', threadRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'API is running', timestamp: new Date().toISOString() });
});

// Root welcome route (only for API, not in production)
if (process.env.NODE_ENV !== 'production') {
  app.get('/', (req, res) => {
    res.json({
      success: true,
      message: 'Welcome to BestApp Forum API',
      version: '1.0.0',
      endpoints: {
        health: '/api/health',
        auth: '/api/auth',
        categories: '/api/categories',
        threads: '/api/threads',
        posts: '/api/posts',
        users: '/api/users',
        search: '/api/search',
        uploads: '/api/uploads'
      },
      documentation: 'https://github.com/rehankhan8743/BestApp'
    });
  });
}

// Seed database route
app.use('/api/seed', seedRoutes);

// Handle React routing in production - return all requests to React app
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    const possiblePaths = [
      path.join(__dirname, 'dist', 'index.html'),
      path.join(process.cwd(), 'dist', 'index.html'),
      '/opt/render/project/src/dist/index.html',
      path.join(__dirname, 'client', 'dist', 'index.html'),
      path.join(process.cwd(), 'client', 'dist', 'index.html'),
      '/opt/render/project/src/client/dist/index.html'
    ];

    let indexPath = possiblePaths[0];
    const fs = require('fs');
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        indexPath = p;
        console.log(`Found index.html at: ${p}`);
        break;
      }
    }

    console.log(`Serving index.html from: ${indexPath}`);
    res.sendFile(indexPath);
  });
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

module.exports = app;
