#!/bin/bash
# ═══════════════════════════════════════════════════════════
# ЦС ТОРО — Bootstrap Script (self-extracting)
# Paste each CHUNK below, then run: bash BOOTSTRAP.sh
# ═══════════════════════════════════════════════════════════
set -e
cd /home/z/my-project || mkdir -p /home/z/my-project && cd /home/z/my-project

echo "📦 Reconstructing source archive..."
cat src_part_* > src.tar.gz.b64
base64 -d src.tar.gz.b64 > src.tar.gz
rm -f src_part_* src.tar.gz.b64

echo "📂 Extracting..."
tar xzf src.tar.gz
rm -f src.tar.gz

echo "⚙️ Installing deps..."
bun install --frozen-lockfile 2>/dev/null || bun install

echo "🗄️ Database..."
bun run db:push

echo "🌱 Seeding..."
npx tsx prisma/seed.ts

echo "🏗️ Building..."
npx next build

echo "📋 Copying assets to standalone..."
mkdir -p .next/standalone/.next/static
cp -r .next/static/* .next/standalone/.next/static/
mkdir -p .next/standalone/public
cp -r public/* .next/standalone/public/ 2>/dev/null || true
mkdir -p .next/standalone/node_modules/xlsx
cp -r node_modules/xlsx/* .next/standalone/node_modules/xlsx/ 2>/dev/null || true
cp .env .next/standalone/.env 2>/dev/null || true

echo "🚀 Starting server..."
NODE_ENV=production node .next/standalone/server.js -p 3000 &
sleep 4
HTTP=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/)
echo "✅ Server status: HTTP $HTTP"
echo "Done!"
