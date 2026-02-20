#!/bin/bash

# Script to switch the Public environment (Blue/Green)
# Usage: ./switch-env.sh [blue|green]

# Load environment variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Load environment variables
if ! source "$SCRIPT_DIR/load-env.sh" "$PROJECT_ROOT/.env.synology"; then
    exit 1
fi

TARGET_ENV="${1:-green}"
TARGET_ENV=$(echo "$TARGET_ENV" | tr '[:upper:]' '[:lower:]')

if [[ "$TARGET_ENV" != "blue" && "$TARGET_ENV" != "green" ]]; then
    echo "❌ Erreur: Cible invalide. Utilisez 'blue' ou 'green'."
    exit 1
fi

echo "🔄 Switching Public environment to $TARGET_ENV..."

# Since we cannot easily automate the Synology Reverse Proxy via script without root/risk,
# we will log the request and update a state file on the NAS to indicate the *intended* active environment.
# In a real scenario with a custom Nginx gateway, we would update the upstream here.

if [ "$TARGET_ENV" == "blue" ]; then
    PORT="8081"
else
    PORT="8080"
fi

echo "⚠️  NOTE: Automatic switching of Synology Reverse Proxy is not fully supported via this script."
echo "👉 Please manually update the Reverse Proxy rule for 'poke.fec.ch' to point to port $PORT."

# We can try to update a state file on the NAS for our monitoring to know what *should* be active
ssh -p "$NAS_PORT" "$NAS_USER@$NAS_IP" "echo '$TARGET_ENV' > /volume1/docker/pokedec-active-env"

echo "✅ Switch request recorded. Active environment set to $TARGET_ENV."
