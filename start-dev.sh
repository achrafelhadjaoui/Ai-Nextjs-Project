#!/bin/bash

# Farisly AI Development Server Starter
# This script cleanly starts the dev server by killing any existing instances first

echo "🔍 Checking for existing processes on port 3001..."

# Find and kill any process using port 3001
PORT_PID=$(lsof -ti:3001)

if [ ! -z "$PORT_PID" ]; then
    echo "⚠️  Found process(es) using port 3001: $PORT_PID"
    echo "🔪 Killing existing processes..."
    kill -9 $PORT_PID 2>/dev/null
    sleep 2
    echo "✅ Old processes killed"
else
    echo "✅ Port 3001 is available"
fi

# Kill any lingering Next.js dev processes
echo "🧹 Cleaning up any lingering Next.js processes..."
pkill -9 -f "next dev" 2>/dev/null
sleep 1

# Start the dev server
echo ""
echo "🚀 Starting Farisly AI development server..."
echo "📍 URL: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop the server"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

npm run dev
