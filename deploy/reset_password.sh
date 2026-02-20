#!/bin/bash

# Load environment variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Load environment variables (use .env.local for local, or pass .env.synology)
ENV_FILE="${1:-$PROJECT_ROOT/.env.local}"
if ! source "$SCRIPT_DIR/load-env.sh" "$ENV_FILE"; then
    exit 1
fi

echo "🔐 Resetting password for $DEFAULT_USER_EMAIL..."

# Generate hash (this is the hash for the password from env)
NEW_HASH='$2b$10$VN12NQ81Bde/T28TSUBrAuodnyGTfRlT/eP5Iigxpix.hHoCOii7u'

echo "📝 Email: $DEFAULT_USER_EMAIL"
echo "📝 New password: $DEFAULT_USER_PASSWORD"
echo "📝 Hash: $NEW_HASH"
echo ""

# 1. Update LOCAL DEV environment
echo "1️⃣  Updating LOCAL DEV (localhost)..."
docker exec ng-pokedec-db-1 psql -U postgres -d postgres -c \
  "UPDATE users SET password = '$NEW_HASH' WHERE email = 'admin@YOUR_DOMAIN.com';" \
  && echo "   ✅ Local DEV updated" \
  || echo "   ❌ Local DEV failed"

echo ""

# 2. Update PROD environment (pokedec - port 8080)
echo "2️⃣  Updating PROD (pokedec - http://192.168.1.199:8080/)..."
echo "   Connecting to NAS..."
ssh -p 6674 eugenio@192.168.1.199 << 'EOF'
  CONTAINER=$(sudo docker ps --format "{{.Names}}" | grep "pokedec" | grep "db" | grep -v "prod" | head -n 1)
  if [ -z "$CONTAINER" ]; then
    echo "   ❌ Could not find pokedec DB container"
    exit 1
  fi
  echo "   Found container: $CONTAINER"
  sudo docker exec $CONTAINER psql -U postgres -d postgres -c \
    "UPDATE users SET password = '\$2b\$10\$VN12NQ81Bde/T28TSUBrAuodnyGTfRlT/eP5Iigxpix.hHoCOii7u' WHERE email = 'admin@YOUR_DOMAIN.com';" \
    && echo "   ✅ PROD (pokedec) updated" \
    || echo "   ❌ PROD (pokedec) failed"
EOF

echo ""

# 3. Update PROD-NEW environment (pokedec-prod - port 8081)
echo "3️⃣  Updating PROD-NEW (pokedec-prod - http://192.168.1.199:8081/)..."
echo "   Connecting to NAS..."
ssh -p 6674 eugenio@192.168.1.199 << 'EOF'
  CONTAINER=$(sudo docker ps --format "{{.Names}}" | grep "pokedec-prod" | grep "db" | head -n 1)
  if [ -z "$CONTAINER" ]; then
    echo "   ❌ Could not find pokedec-prod DB container"
    exit 1
  fi
  echo "   Found container: $CONTAINER"
  sudo docker exec $CONTAINER psql -U postgres -d postgres -c \
    "UPDATE users SET password = '\$2b\$10\$VN12NQ81Bde/T28TSUBrAuodnyGTfRlT/eP5Iigxpix.hHoCOii7u' WHERE email = 'admin@YOUR_DOMAIN.com';" \
    && echo "   ✅ PROD-NEW (pokedec-prod) updated" \
    || echo "   ❌ PROD-NEW (pokedec-prod) failed"
EOF

echo ""
echo "🎉 Password reset complete!"
echo ""
echo "📌 Login credentials:"
echo "   Email: admin@YOUR_DOMAIN.com"  
echo "   Password: password123"
echo ""
echo "🌐 Test on:"
echo "   • Local:     https://localhost/"
echo "   • PROD:      http://192.168.1.199:8080/"
echo "   • PROD-NEW:  http://192.168.1.199:8081/"
