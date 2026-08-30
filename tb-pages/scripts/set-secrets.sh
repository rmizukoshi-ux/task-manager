#!/usr/bin/env bash
# 本番Secrets設定スクリプト
# 実行前に各値を準備してください
set -euo pipefail

cd "$(dirname "$0")/../api"

echo "=== API Worker Secrets設定 ==="
echo "各Secretの値を入力してください（入力内容は表示されません）"
echo ""

echo "GOOGLE_CLIENT_ID:"
npx wrangler secret put GOOGLE_CLIENT_ID

echo ""
echo "GOOGLE_CLIENT_SECRET:"
npx wrangler secret put GOOGLE_CLIENT_SECRET

echo ""
echo "JWT_SECRET（長くランダムな文字列を推奨）:"
npx wrangler secret put JWT_SECRET

echo ""
echo "ADMIN_EMAILS（カンマ区切り、例: r.mizukoshi@a-cial.com）:"
npx wrangler secret put ADMIN_EMAILS

echo ""
echo "UPLOADER_EMAILS（カンマ区切り）:"
npx wrangler secret put UPLOADER_EMAILS

echo ""
echo "=== Sandbox Worker Secrets設定 ==="
cd "../sandbox"

echo "JWT_SECRET（APIと同じ値を入力）:"
npx wrangler secret put JWT_SECRET

echo ""
echo "=== Secrets設定完了 ==="
