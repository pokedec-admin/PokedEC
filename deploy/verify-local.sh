#!/bin/bash
# Verify local connectivity on NAS

NAS_USER="eugenio"
NAS_IP="192.168.1.199"
NAS_PORT="6674"

echo "🔍 Vérification de la connectivité locale sur le NAS..."
echo ""

ssh -p $NAS_PORT $NAS_USER@$NAS_IP << 'ENDSSH'
echo "Testing localhost:8081..."
curl -I http://localhost:8081/home
echo ""
echo "Testing localhost:8081 (root)..."
curl -I http://localhost:8081/

echo ""
echo "Testing logo accessibility..."
curl -I http://localhost:8081/logo_pokedec.jpeg
ENDSSH
