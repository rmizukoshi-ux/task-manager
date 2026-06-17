#!/usr/bin/env bash
set -euo pipefail

echo "=== T&B Pages 本番デプロイ ==="
echo ""

ROOT="$(dirname "$0")/.."

# 1. フロントエンドをビルド
echo "[1/5] フロントエンドをビルド..."
cd "$ROOT/frontend"
VITE_SANDBOX_BASE_URL=https://sandbox.a-cial.com npm run build
echo "Done."

# 2. フロントエンドをCloudflare Pagesにデプロイ
echo ""
echo "[2/5] フロントエンドをCloudflare Pagesにデプロイ..."
npx wrangler pages deploy dist --project-name tb-pages-frontend
echo "Done."

# 3. APIをCloudflare Workersにデプロイ
echo ""
echo "[3/5] API WorkerをDeployment..."
cd "$ROOT/api"
npx wrangler deploy
echo "Done."

# 4. サンドボックスWorkerをデプロイ
echo ""
echo "[4/5] Sandbox WorkerをDeployment..."
cd "$ROOT/sandbox"
npx wrangler deploy
echo "Done."

# 5. D1マイグレーション（本番）
echo ""
echo "[5/5] D1マイグレーション（本番）を適用..."
cd "$ROOT/api"
npx wrangler d1 migrations apply tb-pages-db --remote
echo "Done."

echo ""
echo "=== デプロイ完了 ==="
echo ""
echo "確認URL:"
echo "  社内ギャラリー : https://tb-pages.a-cial.com/gallery"
echo "  外部公開       : https://tb-pages.a-cial.com/"
echo "  ログイン       : https://tb-pages.a-cial.com/login"
