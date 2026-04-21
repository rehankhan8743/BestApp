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
    <div style={{ fontFamily: 'Arial', maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ textAlign: 'center', color: '#667eea' }}>BestApp - Free App Sharing</h1>

      <form onSubmit={handleSubmit} style={{
        marginBottom: '20px',
        border: '1px solid #ccc',
        padding: '20px',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ marginTop: 0 }}>📱 Share an App</h2>
        <input
          type="text"
          placeholder="App Name"
          value={form.title}
          onChange={e => setForm({...form, title: e.target.value})}
          required
          style={{ display: 'block', margin: '10px 0', width: '100%', padding: '10px', fontSize: '16px', borderRadius: '5px', border: '1px solid #ddd' }}
        />
        <input
          type="text"
          placeholder="Download Link (Drive/Telegram)"
          value={form.fileLink}
          onChange={e => setForm({...form, fileLink: e.target.value})}
          required
          style={{ display: 'block', margin: '10px 0', width: '100%', padding: '10px', fontSize: '16px', borderRadius: '5px', border: '1px solid #ddd' }}
        />
        <textarea
          placeholder="Description"
          value={form.description}
          onChange={e => setForm({...form, description: e.target.value})}
          rows="4"
          style={{ display: 'block', margin: '10px 0', width: '100%', padding: '10px', fontSize: '16px', borderRadius: '5px', border: '1px solid #ddd', resize: 'vertical' }}
        />
        <button
          type="submit"
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '18px',
            backgroundColor: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginTop: '10px'
          }}
        >
          📤 Post App
        </button>
      </form>

      <div>
        <h2 style={{ color: '#764ba2' }}>📋 All Apps ({posts.length})</h2>
        {posts.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666' }}>No apps posted yet. Be the first! 🎉</p>
        ) : (
          posts.map(post => (
            <div key={post._id} style={{
              border: '1px solid #ddd',
              margin: '15px 0',
              padding: '20px',
              borderRadius: '10px',
              boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
              backgroundColor: '#f9f9f9'
            }}>
              <h3 style={{ color: '#667eea', marginTop: 0 }}>{post.title}</h3>
              <p style={{ color: '#555' }}>{post.description}</p>
              <a
                href={post.fileLink}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  marginTop: '10px',
                  padding: '8px 16px',
                  backgroundColor: '#764ba2',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '5px'
                }}
              >
                ⬇️ Download Link
              </a>
              <p style={{ fontSize: '12px', color: '#999', marginTop: '10px' }}>
                Posted: {new Date(post.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default App
