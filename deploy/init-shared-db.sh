#!/bin/bash

# Load environment variables from .env.synology file
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Load environment variables
if ! source "$SCRIPT_DIR/load-env.sh" "$PROJECT_ROOT/.env.synology"; then
    exit 1
fi

echo "🚀 Initializing Shared Infrastructure on NAS ($NAS_USER@$NAS_IP)..."

# 1. Create directory
ssh -p "$NAS_PORT" "$NAS_USER@$NAS_IP" "mkdir -p /volume1/docker/pokedec-shared"

# 2. Transfer compose file
cat "$SCRIPT_DIR/docker-compose.shared.yml" | ssh -p "$NAS_PORT" "$NAS_USER@$NAS_IP" "cat > /volume1/docker/pokedec-shared/docker-compose.yml"

# 3. Start shared services
ssh -p "$NAS_PORT" "$NAS_USER@$NAS_IP" "bash -s" << EOF
    cd /volume1/docker/pokedec-shared
    echo "🏗️  Starting shared database and network..."
    sudo /usr/local/bin/docker-compose up -d
    
    echo "✅ Shared infrastructure is running."
    sudo /usr/local/bin/docker-compose ps
EOF

echo "🎉 Shared infrastructure initialization complete!"
