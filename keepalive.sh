#!/bin/bash
cd /home/z/my-project
while true; do
  echo "Starting server at $(date)" >> /tmp/keepalive.log
  npx next dev -p 3000 > /tmp/next-keep.log 2>&1 &
  SRV_PID=$!
  
  # Ping every 2 seconds, restart if dead
  for i in $(seq 1 150); do
    sleep 2
    if ! kill -0 $SRV_PID 2>/dev/null; then
      echo "Server process $SRV_PID died at $(date)" >> /tmp/keepalive.log
      break
    fi
    curl -s -o /dev/null http://localhost:3000/ 2>/dev/null &
  done
  
  # Kill any leftover
  kill $SRV_PID 2>/dev/null
  sleep 1
done
