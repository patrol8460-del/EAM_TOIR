#!/bin/bash
cd /home/z/my-project
while true; do
  npx next dev --port 3000 2>&1
  echo "$(date): next dev died, restarting..." >> /tmp/dev-restart.log
  sleep 2
done
