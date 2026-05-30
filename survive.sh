#!/bin/bash
cd /home/z/my-project
while true; do
  NODE_ENV=production node .next/standalone/server.js -p 3000 &
  CHILD=$!
  # Ping localhost every 1s to keep the process busy
  while kill -0 $CHILD 2>/dev/null; do
    curl -s -m 1 http://localhost:3000/ >/dev/null 2>&1 || true
    sleep 1
  done
  sleep 1
done
