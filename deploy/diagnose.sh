#!/bin/bash
# Diagnostic script for NAS containers

NAS_USER="eugenio"
NAS_IP="192.168.1.199"
NAS_PORT="6674"
NAS_PATH="/volume1/docker/pokedec-prod"

echo "🔍 Diagnostic des conteneurs sur le NAS..."
echo ""

ssh -p $NAS_PORT -t $NAS_USER@$NAS_IP << 'ENDSSH'
cd /volume1/docker/pokedec-prod

echo "📊 État des conteneurs:"
sudo /usr/local/bin/docker-compose ps

echo ""
echo "📋 Logs Nginx (dernières 30 lignes):"
sudo /usr/local/bin/docker-compose logs --tail=30 nginx

echo ""
echo "📋 Logs Frontend (dernières 20 lignes):"
sudo /usr/local/bin/docker-compose logs --tail=20 frontend

echo ""
echo "📋 Logs Backend (dernières 20 lignes):"
sudo /usr/local/bin/docker-compose logs --tail=20 backend

echo ""
echo "🔌 Ports en écoute sur le NAS:"
sudo netstat -tlnp | grep -E ':(8080|5443|5433)'

ENDSSH
