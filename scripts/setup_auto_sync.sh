#!/bin/bash

# Script d'installation de la synchronisation automatique vers Supabase
# Ce script configure une tâche cron pour synchroniser la base de données toutes les heures

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "🔧 Configuration de la synchronisation automatique vers Supabase"
echo ""

# Vérifier que les variables Supabase sont configurées
if [ ! -f "$PROJECT_ROOT/.env.synology" ]; then
    echo "❌ Fichier .env.synology introuvable"
    exit 1
fi

source "$PROJECT_ROOT/.env.synology"

if [ -z "$SUPABASE_DB_HOST" ]; then
    echo "❌ SUPABASE_DB_HOST n'est pas configuré dans .env.synology"
    echo ""
    echo "Veuillez ajouter les lignes suivantes à votre fichier .env.synology :"
    echo ""
    echo "SUPABASE_DB_HOST=db.xxx.supabase.co"
    echo "SUPABASE_DB_PASSWORD=votre_password"
    echo "SUPABASE_DB_USER=postgres"
    echo "SUPABASE_DB_NAME=postgres"
    echo ""
    exit 1
fi

echo "✅ Configuration Supabase détectée"
echo "   Host: $SUPABASE_DB_HOST"
echo ""

# Tester la connexion à Supabase
echo "🔍 Test de connexion à Supabase..."
PGPASSWORD=$SUPABASE_DB_PASSWORD psql -h $SUPABASE_DB_HOST -U $SUPABASE_DB_USER -d $SUPABASE_DB_NAME -c "SELECT version();" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Connexion à Supabase réussie"
else
    echo "❌ Impossible de se connecter à Supabase"
    echo "   Vérifiez vos credentials dans .env.synology"
    exit 1
fi

# Créer le script de synchronisation si nécessaire
SYNC_SCRIPT="$SCRIPT_DIR/sync_to_supabase.sh"
if [ ! -f "$SYNC_SCRIPT" ]; then
    echo "❌ Script sync_to_supabase.sh introuvable"
    exit 1
fi

chmod +x "$SYNC_SCRIPT"

# Proposer d'ajouter à crontab
echo ""
echo "📅 Configuration de la tâche automatique"
echo ""
echo "Voulez-vous configurer une synchronisation automatique ?"
echo "Options disponibles :"
echo "  1) Toutes les heures"
echo "  2) Toutes les 6 heures"
echo "  3) Une fois par jour (à 2h du matin)"
echo "  4) Ne pas configurer maintenant"
echo ""
read -p "Votre choix [1-4]: " choice

case $choice in
    1)
        CRON_SCHEDULE="0 * * * *"
        DESCRIPTION="toutes les heures"
        ;;
    2)
        CRON_SCHEDULE="0 */6 * * *"
        DESCRIPTION="toutes les 6 heures"
        ;;
    3)
        CRON_SCHEDULE="0 2 * * *"
        DESCRIPTION="tous les jours à 2h"
        ;;
    4)
        echo "⏭️  Configuration manuelle requise"
        echo ""
        echo "Pour configurer manuellement, ajoutez cette ligne à votre crontab :"
        echo "0 * * * * $SYNC_SCRIPT >> /var/log/pokedec_sync.log 2>&1"
        exit 0
        ;;
    *)
        echo "❌ Choix invalide"
        exit 1
        ;;
esac

# Ajouter à crontab
CRON_ENTRY="$CRON_SCHEDULE $SYNC_SCRIPT >> /var/log/pokedec_sync.log 2>&1"

# Vérifier si l'entrée existe déjà
crontab -l 2>/dev/null | grep -q "$SYNC_SCRIPT"
if [ $? -eq 0 ]; then
    echo "⚠️  Une tâche cron existe déjà pour ce script"
    read -p "Voulez-vous la remplacer ? [o/N]: " replace
    if [ "$replace" != "o" ] && [ "$replace" != "O" ]; then
        echo "❌ Annulé"
        exit 0
    fi
    # Supprimer l'ancienne entrée
    crontab -l 2>/dev/null | grep -v "$SYNC_SCRIPT" | crontab -
fi

# Ajouter la nouvelle entrée
(crontab -l 2>/dev/null; echo "$CRON_ENTRY") | crontab -

echo "✅ Tâche cron configurée : $DESCRIPTION"
echo ""
echo "📊 Résumé de la configuration :"
echo "   - Fréquence : $DESCRIPTION"
echo "   - Script : $SYNC_SCRIPT"
echo "   - Logs : /var/log/pokedec_sync.log"
echo ""
echo "Pour vérifier les tâches cron : crontab -l"
echo "Pour voir les logs : tail -f /var/log/pokedec_sync.log"
echo ""
echo "🎉 Configuration terminée !"
