#!/bin/bash

# Helper script to load environment variables from .env files
# Source this script in other scripts: source ./deploy/load-env.sh

# Determine which env file to use based on argument or default to local
ENV_FILE="${1:-.env.local}"

# Check if env file exists
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Erreur: Fichier d'environnement '$ENV_FILE' introuvable!"
    echo "📝 Créez ce fichier à partir de .env.example"
    echo "   cp .env.example $ENV_FILE"
    exit 1
fi

# Load environment variables
echo "📂 Chargement des variables depuis: $ENV_FILE"
set -a  # automatically export all variables
source "$ENV_FILE"
set +a

# Validate critical variables
REQUIRED_VARS=("NAS_USER" "NAS_IP" "NAS_PORT" "NAS_PATH")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ] || [ "${!var}" == "YOUR_"*"_HERE" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    echo "❌ Erreur: Variables manquantes ou non configurées dans $ENV_FILE:"
    printf '   - %s\n' "${MISSING_VARS[@]}"
    echo "📝 Veuillez éditer $ENV_FILE et configurer ces variables"
    exit 1
fi

echo "✅ Variables d'environnement chargées avec succès"
echo "   NAS: $NAS_USER@$NAS_IP:$NAS_PORT"
echo "   Path: $NAS_PATH"
