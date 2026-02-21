#!/usr/bin/env bash
# Send a Supabase invite using the Admin API
# Usage:
# SUPABASE_URL=https://<project>.supabase.co SERVICE_ROLE_KEY=ey... ./invite-user.sh user@example.com https://www.pokedec.ch/accept-invite

set -euo pipefail

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 email [redirect_to]"
  exit 1
fi

EMAIL="$1"
REDIRECT_TO="${2:-https://www.pokedec.ch/accept-invite}"

if [ -z "${SUPABASE_URL:-}" ] || [ -z "${SERVICE_ROLE_KEY:-}" ]; then
  echo "Error: Please set SUPABASE_URL and SERVICE_ROLE_KEY environment variables." >&2
  exit 2
fi

echo "Inviting ${EMAIL} with redirect ${REDIRECT_TO}..."

curl -sS -X POST "${SUPABASE_URL}/auth/v1/invite" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"${EMAIL}\", \"redirect_to\": \"${REDIRECT_TO}\"}"

echo
