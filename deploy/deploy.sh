#!/bin/bash
set -e

APP_DIR="/var/www/botstudiox"

echo "=== BotStudioX Deploy Script ==="
echo ""

cd "$APP_DIR"

# ─── 1. Install frontend dependencies & build ───────────────────────────────
echo "[1/5] Building frontend..."
npm ci
npm run build
echo "Frontend built to docs/"

# ─── 2. Install backend dependencies & build ────────────────────────────────
echo "[2/5] Building backend..."
cd server
npm ci
npx prisma generate
npx prisma db push
npm run build
echo "Backend built to dist/"

# ─── 3. Install only production deps for runtime ────────────────────────────
echo "[3/5] Installing production dependencies..."
npm ci --omit=dev
npx prisma generate
cd ..

# ─── 4. Start/restart with PM2 ──────────────────────────────────────────────
echo "[4/5] Starting app with PM2..."
cd server
pm2 delete botstudiox 2>/dev/null || true
pm2 start dist/index.js --name botstudiox --env production
pm2 save
cd ..

# ─── 5. Setup PM2 startup (run once) ────────────────────────────────────────
echo "[5/5] Configuring PM2 startup..."
pm2 startup systemd -u $USER --hp $HOME 2>/dev/null || true
pm2 save

echo ""
echo "=== Deploy complete! ==="
echo "App running on port 4000"
echo "Run 'pm2 logs botstudiox' to see logs"
echo ""
