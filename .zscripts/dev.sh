#!/bin/bash
cd /home/z/my-project

echo "[DEV] Installing dependencies..."
bun install --frozen-lockfile 2>/dev/null || bun install

echo "[DEV] Pushing database schema..."
bun run db:push 2>/dev/null || true

echo "[DEV] Building for production..."
npx next build 2>/dev/null
cp -r .next/static .next/standalone/.next/ 2>/dev/null
cp -r public .next/standalone/ 2>/dev/null

echo "[DEV] Starting production server with auto-restart on port 3000..."
while true; do
  NODE_ENV=production node .next/standalone/server.js -p 3000
  echo "[DEV] Server stopped, restarting in 2s..." >> /home/z/my-project/server.log
  sleep 2
done
