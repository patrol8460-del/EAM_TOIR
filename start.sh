#!/bin/bash
# === CMMS ЦС ТОРО — Server Startup Script ===
# Usage: bash start.sh
# Starts production server with aggressive keepalive to prevent sandbox process killing.

cd "$(dirname "$0")"

echo "🚀 Starting ЦС ТОРО CMMS..."

# Kill any existing processes
pkill -f "next dev" 2>/dev/null
pkill -f "next start" 2>/dev/null
pkill -f "next build" 2>/dev/null
sleep 1

# Build first
echo "📦 Building..."
npx next build > /tmp/cmms-build.log 2>&1
if [ $? -ne 0 ]; then
  echo "❌ Build failed. See /tmp/cmms-build.log"
  cat /tmp/cmms-build.log
  exit 1
fi
echo "✅ Build complete"

# Start production server in background
npx next start -p 3000 > /tmp/cmms-server.log 2>&1 &

# Keepalive — pings server every 5 seconds, restarts if dead
(
  sleep 5
  while true; do
    if ! curl -s -o /dev/null --connect-timeout 2 --max-time 3 http://localhost:3000/ 2>/dev/null; then
      echo "⚠️  Server died, restarting..." >> /tmp/cmms-keepalive.log
      pkill -f "next start" 2>/dev/null
      sleep 1
      cd "$(dirname "$0")"
      npx next start -p 3000 > /tmp/cmms-server.log 2>&1 &
      echo "✅ Restarted at $(date)" >> /tmp/cmms-keepalive.log
    fi
    sleep 5
  done
) > /dev/null 2>&1 &

# Wait for server to be ready
for i in $(seq 1 30); do
  if curl -s -o /dev/null --connect-timeout 2 --max-time 3 http://localhost:3000/ 2>/dev/null; then
    echo "✅ Server is ready on http://localhost:3000"
    exit 0
  fi
  sleep 1
done

echo "❌ Server failed to start"
exit 1
