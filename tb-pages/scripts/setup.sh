#!/usr/bin/env bash
set -euo pipefail

echo "=== T&B Pages Phase 1 Setup ==="
echo ""

# Install dependencies
echo "[1/5] Installing dependencies..."
cd "$(dirname "$0")/.."
npm install
echo "Done."

# Create D1 database
echo ""
echo "[2/5] Creating D1 database (tb-pages-db)..."
echo "Run: wrangler d1 create tb-pages-db"
echo "Then update api/wrangler.toml and sandbox/wrangler.toml with the returned database_id."
echo ""

# Create R2 bucket
echo "[3/5] Creating R2 bucket (tb-pages-storage)..."
echo "Run: wrangler r2 bucket create tb-pages-storage"
echo ""

# Run local migration
echo "[4/5] Applying local D1 migration..."
cd api
npx wrangler d1 migrations apply tb-pages-db --local
cd ..
echo "Done."

# Set secrets reminder
echo ""
echo "[5/5] Set required secrets via wrangler secret put:"
echo "  cd api"
echo "  npx wrangler secret put GOOGLE_CLIENT_ID"
echo "  npx wrangler secret put GOOGLE_CLIENT_SECRET"
echo "  npx wrangler secret put JWT_SECRET"
echo "  npx wrangler secret put ADMIN_EMAILS"
echo "  npx wrangler secret put UPLOADER_EMAILS"
echo ""
echo "=== Setup complete. Run 'npm run dev' to start local development. ==="
