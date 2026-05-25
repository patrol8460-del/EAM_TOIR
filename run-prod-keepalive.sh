#!/bin/bash
cd /home/z/my-project

echo "[$(date)] Starting production server..." >> /home/z/my-project/server.log

while true; do
    NODE_ENV=production node .next/standalone/server.js -p 3000 >> /home/z/my-project/server.log 2>&1
    EXIT_CODE=$?
    echo "[$(date)] Server exited with code $EXIT_CODE, restarting in 2s..." >> /home/z/my-project/server.log
    sleep 2
done
