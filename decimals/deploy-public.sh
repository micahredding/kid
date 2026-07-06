#!/usr/bin/env bash
#
# deploy-public.sh — publish the standalone Numberblocks decimals game to
# Cloudflare Pages so it can be shared with family (public link).
#
# Run this ON mini4 (that's where `wrangler login` was done):
#   ssh mini4 'cd ~/projects/kid-games/decimals && ./deploy-public.sh'
#
# Public URL (production, main branch):
#   https://numberblocks-decimals.pages.dev
#
# First-time project creation (already done once):
#   npx wrangler@latest pages project create numberblocks-decimals --production-branch main
#
set -euo pipefail

export PATH="/opt/homebrew/bin:$PATH"   # wrangler/npx live here on mini4
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT="numberblocks-decimals"

cd "$DIR"
echo "==> Deploying $DIR to Cloudflare Pages project '$PROJECT'"
npx wrangler@latest pages deploy . --project-name "$PROJECT" --branch main --commit-dirty=true

echo
echo "Live at: https://${PROJECT}.pages.dev"
