#!/bin/bash

# Script de synchronisation du NAS vers Supabase
# Usage: ./sync_to_supabase.sh

# Chargement des variables (doivent être ajoutées à .env.synology)
# SUPABASE_DB_HOST=db.xxx.supabase.co
# SUPABASE_DB_PASSWORD=votre_password
# SUPABASE_DB_NAME=postgres
# SUPABASE_DB_USER=postgres

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

if [ -f "$PROJECT_ROOT/.env.synology" ]; then
    export $(grep -v '^#' "$PROJECT_ROOT/.env.synology" | xargs)
fi

echo "🔄 Début de la synchronisation vers Supabase..."

# On fait un dump léger (données uniquement car la structure devrait être la même)
# On exclut les tables de log ou temporaires si nécessaire
pg_dump -h localhost -p 5434 -U postgres --clean --if-exists postgres | \
    PGPASSWORD=$SUPABASE_DB_PASSWORD psql -h $SUPABASE_DB_HOST -U $SUPABASE_DB_USER -d $SUPABASE_DB_NAME

if [ $? -eq 0 ]; then
    echo "✅ Synchronisation réussie !"
else
    echo "❌ Échec de la synchronisation."
    exit 1
fi
