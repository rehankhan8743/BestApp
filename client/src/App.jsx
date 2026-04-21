import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [posts, setPosts] = useState([])
  const [form, setForm] = useState({ title: '', fileLink: '', description: '' })

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      const response = await axios.get('/api/posts')
      setPosts(response.data)
    } catch (error) {
      console.error('Error fetching posts:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await axios.post('/api/posts', form)
      setForm({ title: '', fileLink: '', description: '' })
      fetchPosts()
    } catch (error) {
      console.error('Error creating post:', error)
    }
  }

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <h1 className="logo">🚀 BestApp</h1>
          <p className="tagline">Share & Download Free Apps</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* Share App Form */}
        <section className="form-section">
          <div className="container">
            <h2 className="section-title">📱 Share an App</h2>
            <form onSubmit={handleSubmit} className="app-form">
              <div className="form-group">
                <label htmlFor="title">App Name</label>
                <input
                  id="title"
                  type="text"
                  placeholder="e.g., WhatsApp, Telegram"
                  value={form.title}
                  onChange={e => setForm({...form, title: e.target.value})}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="fileLink">Download Link</label>
                <input
                  id="fileLink"
                  type="url"
                  placeholder="https://drive.google.com/... or https://t.me/..."
                  value={form.fileLink}
                  onChange={e => setForm({...form, fileLink: e.target.value})}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  placeholder="Describe the app (features, version, etc.)"
                  value={form.description}
                  onChange={e => setForm({...form, description: e.target.value})}
                  rows="4"
                  className="form-textarea"
                />
              </div>

              <button type="submit" className="submit-btn">
                📤 Post App
              </button>
            </form>
          </div>
        </section>

        {/* Apps List */}
        <section className="apps-section">
          <div className="container">
            <h2 className="section-title">
              📋 All Apps 
              <span className="apps-count">({posts.length})</span>
            </h2>
            
            {posts.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🎉</div>
                <p>No apps posted yet.</p>
                <p className="empty-subtitle">Be the first to share an app!</p>
              </div>
            ) : (
              <div className="apps-grid">
                {posts.map(post => (
                  <div key={post._id} className="app-card">
                    <div className="card-header">
                      <h3 className="card-title">{post.title}</h3>
                      <span className="card-date">
                        {new Date(post.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    
                    <p className="card-description">
                      {post.description || 'No description provided'}
                    </p>
                    
                    <div className="card-footer">
                      <a
                        href={post.fileLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="download-btn"
                      >
                        ⬇️ Download
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer">
        <p>Made with ❤️ using MERN Stack</p>
        <p className="footer-note">Share free apps with the community!</p>
      </footer>
    </div>
  )
}

export default App
