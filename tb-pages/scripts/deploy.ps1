Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$ROOT = Split-Path -Parent $PSScriptRoot

Write-Host "=== T&B Pages 本番デプロイ ===" -ForegroundColor Cyan
Write-Host ""

# 1. Sandbox Worker
Write-Host "[1/3] Sandbox Worker をデプロイ..." -ForegroundColor Yellow
Set-Location "$ROOT\sandbox"
npx wrangler deploy
Write-Host "Done." -ForegroundColor Green

# 2. D1 マイグレーション
Write-Host ""
Write-Host "[2/3] D1 マイグレーション（本番）を適用..." -ForegroundColor Yellow
Set-Location "$ROOT\api"
npx wrangler d1 migrations apply tb-pages-db --remote
Write-Host "Done." -ForegroundColor Green

Write-Host ""
Write-Host "=== デプロイ完了 ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "確認URL:"
Write-Host "  フロントエンド : https://ef7cd75b.tb-pages-frontend.pages.dev"
Write-Host "  API            : https://tb-pages-api.acial-recruitment.workers.dev"
