#!/bin/bash

echo "🚀 Starting Burnlist with Finviz API server..."

# Kill any existing processes on the ports we need
echo "🔄 Cleaning up existing processes..."
pkill -f "finviz-api-server.cjs" 2>/dev/null
pkill -f "vite" 2>/dev/null

# Start Finviz API server in the background
echo "📊 Starting Finviz API server on port 3001..."
node finviz-api-server.cjs &
FINVIZ_PID=$!

# Wait a moment for the Finviz server to start
sleep 2

# Check if Finviz server started successfully
if curl -s http://localhost:3001/api/finviz-quote?ticker=AAPL&timeframe=d > /dev/null; then
    echo "✅ Finviz API server is running on http://localhost:3001"
else
    echo "❌ Failed to start Finviz API server"
    kill $FINVIZ_PID 2>/dev/null
    exit 1
fi

# Start the Burnlist frontend
echo "🌐 Starting Burnlist frontend..."
npm run dev &
FRONTEND_PID=$!

# Wait a moment for the frontend to start
sleep 3

echo "✅ Both servers are running!"
echo "📊 Finviz API: http://localhost:3001"
echo "🌐 Burnlist: http://localhost:5173 (or check terminal for actual port)"
echo ""
echo "Press Ctrl+C to stop both servers"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $FINVIZ_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ Servers stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Keep the script running
wait 