#!/bin/bash
# Start BestApp Backend
cd /root/.nanobot/workspace/BestApp
node server.js &
echo "Backend started on http://localhost:5000"

# Wait a moment
sleep 3

# Start Frontend
cd /root/.nanobot/workspace/BestApp/client
npm run dev &
echo "Frontend started on http://localhost:5173"

echo ""
echo "✅ BestApp is running!"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:5000"
echo "   API:      http://localhost:5000/api/posts"
