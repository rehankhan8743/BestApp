require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from React build
app.use(express.static(path.join(__dirname, 'client/dist')));

// Root route - serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/dist/index.html'));
});

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bestapp';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.log('❌ MongoDB Connection Error:', err.message));

// Schema & Model for App Posts
const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  fileLink: { type: String, required: true },
  description: String,
  createdAt: { type: Date, default: Date.now }
});

const Post = mongoose.model('Post', postSchema);

// API Routes

// GET all posts
app.get('/api/posts', async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single post
app.get('/api/posts/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create post
app.post('/api/posts', async (req, res) => {
  try {
    const { title, fileLink, description } = req.body;
    if (!title || !fileLink) {
      return res.status(400).json({ error: 'Title and fileLink are required' });
    }

    const post = await Post.create({ title, fileLink, description });
    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update post
app.put('/api/posts/:id', async (req, res) => {
  try {
    const { title, fileLink, description } = req.body;
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { title, fileLink, description },
      { new: true, runValidators: true }
    );
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE post
app.delete('/api/posts/:id', async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'BestApp API is running! 🚀',
    timestamp: new Date().toISOString()
  });
});

// React Router fallback - serve index.html for all non-API routes (Express 5.0 syntax)
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/dist/index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📦 BestApp - Full Stack MERN Application`);
});
