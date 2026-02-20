#!/bin/bash
# Helper script to start containers on NAS with sudo handling

NAS_USER="eugenio"
NAS_IP="192.168.1.199"
NAS_PORT="6674"
NAS_PATH="/volume1/docker/pokedec-prod"

echo "🚀 Démarrage des conteneurs sur le NAS..."

# Check if password is provided
if [ -z "$1" ]; then
    echo "❌ Erreur: Veuillez fournir le mot de passe NAS en argument."
    echo "Usage: $0 <NAS_PASSWORD>"
    exit 1
fi
NAS_PASS="$1"

# Start containers with sudo password
ssh -p $NAS_PORT $NAS_USER@$NAS_IP << EOF
  cd $NAS_PATH
  
  echo "🛑 Arrêt des conteneurs existants..."
  echo "$NAS_PASS" | sudo -S /usr/local/bin/docker-compose down 2>/dev/null || true
  
  echo "🏗️  Démarrage des conteneurs..."
  echo "$NAS_PASS" | sudo -S /usr/local/bin/docker-compose up -d --build
  
  echo "📊 État des conteneurs:"
  echo "$NAS_PASS" | sudo -S /usr/local/bin/docker-compose ps
EOF

echo ""
echo "✅ Terminé !"
echo "📍 Application accessible sur: https://$NAS_IP"
