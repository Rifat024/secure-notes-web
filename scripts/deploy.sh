#!/usr/bin/env bash
#
# Builds and deploys the frontend to Vercel production.
#
# Usage: npm run deploy [-- <api-url>]
#
# The API URL comes from the first argument, VITE_API_URL, or .env.production, in that order.

set -euo pipefail

cd "$(dirname "$0")/.."

log() { printf '\033[1;36m==>\033[0m %s\n' "$*"; }
fail() { printf '\033[1;31mError:\033[0m %s\n' "$*" >&2; exit 1; }

command -v vercel >/dev/null || fail "Vercel CLI not found. Install it with: npm i -g vercel"
vercel whoami >/dev/null 2>&1 || fail "Not logged in to Vercel. Run: vercel login"

load_env_file() {
  local key value
  while IFS='=' read -r key value || [[ -n "$key" ]]; do
    [[ -z "$key" || "$key" == \#* ]] && continue
    value="${value%$'\r'}"
    value="${value#\"}"; value="${value%\"}"
    [[ -z "${!key:-}" && -n "$value" ]] && export "$key=$value"
  done < "$1"
}

[[ -f .env.production ]] && load_env_file .env.production

API_URL="${1:-${VITE_API_URL:-}}"
API_URL="${API_URL%/}"
[[ -n "$API_URL" ]] || fail "Pass the API URL as an argument or set VITE_API_URL"

log "Checking API at $API_URL"
status="$(curl -s -o /dev/null -w '%{http_code}' "$API_URL/api/health")"
[[ "$status" == 200 ]] || log "Warning: $API_URL/api/health returned $status; deploying anyway"

[[ -d .vercel ]] || { log "Linking Vercel project"; vercel link --yes --project secure-notes-web >/dev/null; }

vercel env rm VITE_API_URL production --yes >/dev/null 2>&1 || true
printf '%s' "$API_URL" | vercel env add VITE_API_URL production >/dev/null
log "Set VITE_API_URL"

log "Verifying local build"
VITE_API_URL="$API_URL" npm run build --silent >/dev/null

log "Deploying to production"
DEPLOY_OUTPUT="$(vercel deploy --prod --yes 2>&1)" || { echo "$DEPLOY_OUTPUT"; fail "Deployment failed"; }
WEB_URL="$(grep -Eo 'Aliased[[:space:]]+https://[^[:space:]]+' <<<"$DEPLOY_OUTPUT" | awk '{print $2}' | tail -1)"
[[ -n "$WEB_URL" ]] || WEB_URL="$(grep -Eo 'https://[^[:space:]"]+\.vercel\.app' <<<"$DEPLOY_OUTPUT" | tail -1)"

status="$(curl -s -o /dev/null -w '%{http_code}' "$WEB_URL")"
[[ "$status" == 200 ]] || fail "$WEB_URL returned $status"

log "Frontend is live at $WEB_URL"
log "Make sure the API's CORS_ORIGIN includes $WEB_URL"
