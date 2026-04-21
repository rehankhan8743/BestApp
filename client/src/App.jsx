import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [message, setMessage] = useState('')
  const [data, setData] = useState([])

  useEffect(() => {
    // Fetch data from backend API
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const response = await axios.get('/api/items')
      setData(response.data)
      setMessage('Connected to backend successfully! 🎉')
    } catch (error) {
      setMessage('Backend not connected yet. Start the server first.')
    }
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>🚀 BestApp</h1>
        <p className="status">{message}</p>
        
        <div className="content">
          <h2>Items from Backend:</h2>
          {data.length > 0 ? (
            <ul>
              {data.map((item, index) => (
                <li key={index}>{item.name}</li>
              ))}
            </ul>
          ) : (
            <p>No data yet. Add some items via API!</p>
          )}
        </div>

        <div className="info">
          <h3>Stack:</h3>
          <ul>
            <li>⚛️ React 18 + Vite</li>
            <li>🟢 Node.js + Express</li>
            <li>🍃 MongoDB + Mongoose</li>
            <li>🔒 CORS + DotEnv</li>
          </ul>
        </div>
      </header>
    </div>
  )
}

export default App
