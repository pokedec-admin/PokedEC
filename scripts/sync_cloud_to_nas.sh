#!/bin/bash
# Script to sync data FROM Cloud (Supabase) TO NAS (local DB)
# Optimized for Synology NAS using the 'backend' container which has pg_dump and internet access

echo "🔄 Starting Sync: Cloud -> NAS (via backend container)..."

# The 'backend' container has pg_dump/psql and internet access
# We target 'db' as the host for import since they are in the same network
sudo /usr/local/bin/docker-compose exec -T backend sh -c "PGPASSWORD='x+DEqb\$GR+5_%p%' pg_dump --clean --if-exists --no-owner --no-privileges -h db.fkcktcwtnmuflasiueji.supabase.co -U postgres postgres | PGPASSWORD=postgres psql -h db -U postgres -d postgres"

if [ $? -eq 0 ]; then
    echo "✅ Sync successful!"
else
    echo "❌ Sync failed."
    exit 1
fi
