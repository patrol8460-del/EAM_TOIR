#!/bin/bash
cd /home/z/my-project
while true; do
  # Check if next dev is running
  if ! pgrep -f "next dev" > /dev/null; then
    echo "$(date): starting next dev" >> /tmp/smart.log
    nohup npx next dev --port 3000 > /tmp/next-dev.log 2>&1 &
    sleep 5
  fi
  # Ping to keep warm
  curl -s -o /dev/null --connect-timeout 2 --max-time 3 http://localhost:3000/ > /dev/null 2>&1
  sleep 3
done
