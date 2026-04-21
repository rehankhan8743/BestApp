# BestApp - Full Stack MERN Application

A modern full-stack application built with MongoDB, Express, React, and Node.js.

## 🚀 Features

- **Frontend**: React 18 + Vite
- **Backend**: Node.js + Express
- **Database**: MongoDB + Mongoose
- **API**: RESTful endpoints with CORS
- **Dev Tools**: Nodemon for auto-reload

## 📁 Project Structure

```
BestApp/
├── client/          # React frontend (Vite)
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── server.js        # Express backend
├── .env             # Environment variables
├── .gitignore
└── package.json     # Backend dependencies
```

## 🛠️ Installation

### Prerequisites
- Node.js (v18+)
- MongoDB (local or Atlas)
- npm or yarn

### Setup

1. **Install backend dependencies:**
```bash
npm install
```

2. **Install frontend dependencies:**
```bash
cd client
npm install
cd ..
```

3. **Configure environment:**
Edit `.env` file with your MongoDB URI:
```
MONGODB_URI=mongodb://localhost:27017/bestapp
PORT=3000
```

## 🏃 Running the App

### Development Mode

**Backend (with nodemon):**
```bash
npm run dev
```

**Frontend (separate terminal):**
```bash
cd client
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/items` | Get all items |
| GET | `/api/items/:id` | Get single item |
| POST | `/api/items` | Create new item |
| PUT | `/api/items/:id` | Update item |
| DELETE | `/api/items/:id` | Delete item |
| GET | `/api/health` | Health check |

## 🧪 Testing API

```bash
# Health check
curl http://localhost:3000/api/health

# Get all items
curl http://localhost:3000/api/items

# Create item
curl -X POST http://localhost:3000/api/items \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Item","description":"A test item"}'
```

## 🌐 Frontend

The React app runs on `http://localhost:5173` in development mode.
It proxies API requests to the backend at `http://localhost:3000`.

## 📝 License

ISC

## 👨‍💻 Author

Rehan Khan (@rehankhan8743)
