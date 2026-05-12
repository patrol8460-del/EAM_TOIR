#!/bin/bash
cd /home/z/my-project
while true; do
  if ! curl -s -m 2 http://localhost:3000/ > /dev/null 2>&1; then
    # Kill any stale processes
    pkill -f "next\|standalone/server" 2>/dev/null
    sleep 1
    # Start production server
    NODE_ENV=production node .next/standalone/server.js -p 3000 &
    echo "[$(date)] Server restarted" >> /home/z/my-project/watchdog.log
    sleep 3
  fi
  sleep 2
done
