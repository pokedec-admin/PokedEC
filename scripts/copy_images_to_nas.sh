#!/bin/bash

# Script pour copier les images Pokémon vers le NAS
# Usage: ./copy_images_to_nas.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Charger les variables d'environnement
if [ -f "$PROJECT_ROOT/.env.synology" ]; then
    source "$PROJECT_ROOT/.env.synology"
fi

echo "📦 Copie des images Pokémon vers le NAS..."
echo ""

# Vérifier que le dossier d'images existe
if [ ! -d "$PROJECT_ROOT/frontend/public/images/pokemon" ]; then
    echo "❌ Le dossier d'images n'existe pas : $PROJECT_ROOT/frontend/public/images/pokemon"
    echo "   Exécutez d'abord : node scripts/internalize_images.js"
    exit 1
fi

# Compter les images
IMAGE_COUNT=$(ls -1 "$PROJECT_ROOT/frontend/public/images/pokemon" | wc -l)
echo "📊 Nombre d'images à copier : $IMAGE_COUNT"
echo ""

# Créer le dossier sur le NAS si nécessaire
echo "📁 Création du dossier sur le NAS..."
ssh -p $NAS_SSH_PORT $NAS_USER@$NAS_IP "mkdir -p /volume1/docker/pokedec/frontend/public/images/pokemon"

if [ $? -ne 0 ]; then
    echo "❌ Impossible de créer le dossier sur le NAS"
    exit 1
fi

echo "✅ Dossier créé"
echo ""

# Copier les images via rsync (plus rapide que scp)
echo "🚀 Copie des images en cours..."
rsync -avz --progress \
    -e "ssh -p $NAS_SSH_PORT" \
    "$PROJECT_ROOT/frontend/public/images/pokemon/" \
    "$NAS_USER@$NAS_IP:/volume1/docker/pokedec/frontend/public/images/pokemon/"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Copie terminée avec succès !"
    echo ""
    echo "📊 Vérification sur le NAS..."
    NAS_COUNT=$(ssh -p $NAS_SSH_PORT $NAS_USER@$NAS_IP "ls -1 /volume1/docker/pokedec/frontend/public/images/pokemon | wc -l")
    echo "   Images sur le NAS : $NAS_COUNT"
    echo ""
    
    if [ "$IMAGE_COUNT" -eq "$NAS_COUNT" ]; then
        echo "✅ Toutes les images ont été copiées !"
    else
        echo "⚠️  Nombre d'images différent (local: $IMAGE_COUNT, NAS: $NAS_COUNT)"
    fi
else
    echo "❌ Erreur lors de la copie"
    exit 1
fi

echo ""
echo "🎉 Images internalisées avec succès sur le NAS !"
echo ""
echo "Prochaines étapes :"
echo "1. Redéployer l'application : ./deploy/deploy-synology.sh blue"
echo "2. Vérifier que les images s'affichent correctement"
