#!/bin/bash
# Auto-restart loop for standalone Next.js server (sandbox resilience)
cd /home/z/my-project

while true; do
  # Build
  npx next build 2>&1 | tail -5
  if [ $? -ne 0 ]; then
    echo "Build failed, retrying in 5s..."
    sleep 5
    continue
  fi

  # Copy static files
  cp -r .next/static .next/standalone/.next/static 2>/dev/null
  cp -r public .next/standalone/public 2>/dev/null

  # Start server
  echo "Starting standalone server..."
  node .next/standalone/server.js 2>&1 &
  SERVER_PID=$!
  echo "Server PID: $SERVER_PID"

  # Wait for server to die
  wait $SERVER_PID 2>/dev/null
  echo "Server died, restarting in 3s..."
  sleep 3
done
