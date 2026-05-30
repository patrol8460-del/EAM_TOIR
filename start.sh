#!/bin/bash
# Keep-sandbox-alive wrapper: starts Next.js dev server and keeps
# writing activity so the sandbox container stays "active".
cd /home/z/my-project

# Ensure port 3000 is free
fuser -k 3000/tcp 2>/dev/null
sleep 1

# Start server in background
npx next dev -p 3000 &
SERVER_PID=$!

# Wait for it to be ready
for i in $(seq 1 30); do
  if curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/ 2>/dev/null | grep -q 200; then
    echo "SERVER_READY PID=$SERVER_PID"
    break
  fi
  sleep 1
done

# Keep sandbox alive by generating continuous activity
while kill -0 $SERVER_PID 2>/dev/null; do
  date +%s > /tmp/sandbox-heartbeat
  sleep 2
done

# If server died, restart everything (exec replaces this process)
echo "SERVER_DIED, restarting..."
exec "$0"
