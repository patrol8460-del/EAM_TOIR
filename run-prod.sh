#!/bin/bash
# Production server keep-alive script
cd /home/z/my-project

while true; do
  NODE_ENV=production node .next/standalone/server.js -p 3000
  echo "[$(date)] Server stopped, restarting in 2s..." >> server.log
  sleep 2
done
