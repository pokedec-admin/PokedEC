#!/bin/bash

# Optionally load variables from .env if it exists
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Define payload JSON correct schema for PUT /env-vars
PAYLOAD=$(cat <<EOF
[
  {"key": "DATABASE_URL", "value": "${DATABASE_URL}"},
  {"key": "SUPABASE_URL", "value": "${SUPABASE_URL}"},
  {"key": "SUPABASE_SERVICE_ROLE_KEY", "value": "${SUPABASE_SERVICE_ROLE_KEY}"},
  {"key": "SUPABASE_ANON_KEY", "value": "${SUPABASE_ANON_KEY}"},
  {"key": "NODE_TLS_REJECT_UNAUTHORIZED", "value": "0"},
  {"key": "NODE_ENV", "value": "production"},
  {"key": "JWT_SECRET", "value": "${JWT_SECRET}"},
  {"key": "FRONTEND_URL", "value": "https://www.pokedec.ch"}
]
EOF
)

# RENDER_API_KEY should be provided via environment variable, not hardcoded
RENDER_API_KEY="${RENDER_API_KEY:-}"
if [ -z "$RENDER_API_KEY" ]; then
  echo "Error: RENDER_API_KEY environment variable is not set."
  exit 1
fi

curl -X PUT "https://api.render.com/v1/services/srv-d6c9mqvgi27c73ddq0ng/env-vars" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  -d "$PAYLOAD"
