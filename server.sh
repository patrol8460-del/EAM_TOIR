#!/bin/bash
cd /home/z/my-project
export PATH="/home/z/.local/share/uv/python/cpython-3.12.13-linux-x86_64-gnu/bin:$PATH"

while true; do
    # Check if server responds
    RESP=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 --max-time 5 http://localhost:3000/ 2>/dev/null)
    
    if [ "$RESP" != "200" ]; then
        # Kill any leftover
        pkill -9 -f "next dev" 2>/dev/null
        sleep 1
        # Start fresh
        nohup npx next dev -p 3000 > /tmp/next-server.log 2>&1 &
        echo "$(date): Server restarted (was $RESP)" >> /tmp/server-restart.log
    fi
    
    sleep 2
done
