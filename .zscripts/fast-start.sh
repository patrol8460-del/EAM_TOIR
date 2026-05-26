#!/bin/bash
cd /home/z/my-project
# Production уже собран — просто запускаем с автоперезапуском
while true; do
  NODE_ENV=production node .next/standalone/server.js -p 3000
  sleep 0.2
done
