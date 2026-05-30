#!/bin/bash
cd /home/z/my-project

echo "[DEV] Installing dependencies..."
bun install --frozen-lockfile 2>/dev/null || bun install

echo "[DEV] Pushing database schema..."
bun run db:push 2>/dev/null || true

echo "[DEV] Seeding database (if empty)..."
npx tsx prisma/seed.ts 2>/dev/null || true

echo "[DEV] Building for production..."
npx next build 2>/dev/null
echo "[DEV] Copying static assets to standalone..."
mkdir -p .next/standalone/.next/static
cp -r .next/static/* .next/standalone/.next/static/
mkdir -p .next/standalone/public
cp -r public/* .next/standalone/public/ 2>/dev/null || true
# Copy server-only deps that Next.js may not trace (xlsx, etc.)
echo "[DEV] Copying server dependencies..."
for pkg in xlsx; do
  if [ -d "node_modules/$pkg" ]; then
    mkdir -p ".next/standalone/node_modules/$pkg"
    cp -r "node_modules/$pkg"/* ".next/standalone/node_modules/$pkg/" 2>/dev/null || true
  fi
done
# Copy .env so standalone can find DATABASE_URL
cp .env .next/standalone/.env 2>/dev/null

echo "[DEV] Starting production server with auto-restart on port 3000..."
while true; do
  NODE_ENV=production node .next/standalone/server.js -p 3000
  echo "[DEV] Server stopped, restarting in 2s..." >> /home/z/my-project/server.log
  sleep 2
done
