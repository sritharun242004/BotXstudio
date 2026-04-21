#!/bin/bash
set -e

echo "=== BotStudioX EC2 Setup Script (Amazon Linux 2023) ==="
echo ""

# ─── 1. System updates ──────────────────────────────────────────────────────
echo "[1/6] Updating system packages..."
sudo dnf update -y

# ─── 2. Install Node.js 20 ──────────────────────────────────────────────────
echo "[2/6] Installing Node.js 20..."
sudo dnf install -y nodejs20 nodejs20-npm
sudo alternatives --install /usr/bin/node node /usr/bin/node-20 100
sudo alternatives --install /usr/bin/npm npm /usr/bin/npm-20 100
echo "Node: $(node -v)  npm: $(npm -v)"

# ─── 3. Install PM2 ─────────────────────────────────────────────────────────
echo "[3/6] Installing PM2..."
sudo npm install -g pm2

# ─── 4. Install Nginx ───────────────────────────────────────────────────────
echo "[4/6] Installing Nginx..."
sudo dnf install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# ─── 5. Install Git ─────────────────────────────────────────────────────────
echo "[5/6] Installing Git..."
sudo dnf install -y git

# ─── 6. Create app directory ────────────────────────────────────────────────
echo "[6/6] Creating app directory..."
sudo mkdir -p /var/www/botstudiox
sudo chown $USER:$USER /var/www/botstudiox

echo ""
echo "=== Setup complete! ==="
echo "Next: Upload your code to /var/www/botstudiox"
echo ""
