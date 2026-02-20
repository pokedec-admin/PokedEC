#!/bin/bash

# Load environment variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Load environment variables
OVERRIDE_NAS_PORT="$NAS_PORT"
if ! source "$SCRIPT_DIR/load-env.sh" "$PROJECT_ROOT/.env.synology"; then
    exit 1
fi
if [ -n "$OVERRIDE_NAS_PORT" ]; then
    NAS_PORT="$OVERRIDE_NAS_PORT"
fi

DUMP_FILE="$1"

if [ -z "$DUMP_FILE" ]; then
    echo "❌ Usage: ./restore_dev_db_to_blue.sh <path_to_dump_file>"
    exit 1
fi

echo "🚀 Restoring database to BLUE environment..."
echo "📂 Dump file: $DUMP_FILE"
echo "🎯 Target: $NAS_USER@$NAS_IP:$NAS_PORT (pokedec-blue-green-db)"

# Transfer dump to NAS (using cat | ssh to avoid scp issues)
echo "📤 Transferring dump to NAS..."
cat "$DUMP_FILE" | ssh -p "$NAS_PORT" "$NAS_USER@$NAS_IP" "cat > /tmp/restore_dump.sql"

# Restore on NAS
echo "📥 Restoring data..."
ssh -p "$NAS_PORT" "$NAS_USER@$NAS_IP" "cat /tmp/restore_dump.sql | sudo /usr/local/bin/docker exec -i pokedec-blue-green-db psql -U postgres -d postgres"

echo "🧹 Cleaning up..."
ssh -p "$NAS_PORT" "$NAS_USER@$NAS_IP" "rm /tmp/restore_dump.sql"

echo "✅ Database restore completed!"
