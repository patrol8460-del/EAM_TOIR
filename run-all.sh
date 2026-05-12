#!/bin/bash
cd /home/z/my-project

# Start IPv6 proxy
node /home/z/my-project/ipv6-proxy.js &

# Start Next.js  
npx next dev -p 3000

# If Next.js exits, kill proxy too
kill %1 2>/dev/null
