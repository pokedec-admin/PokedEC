#!/bin/bash
# Script to configure sudo without password for docker commands

NAS_USER="eugenio"
NAS_IP="192.168.1.199"
NAS_PORT="6674"

echo "🔧 Configuration de sudo sur le NAS..."
echo "⚠️  Vous allez devoir entrer votre mot de passe NAS UNE SEULE FOIS."
echo ""

# Connect and configure sudo
ssh -p $NAS_PORT -t $NAS_USER@$NAS_IP << 'ENDSSH'
echo "📝 Création du fichier de configuration sudo..."
echo 'eugenio ALL=(ALL) NOPASSWD: /usr/local/bin/docker-compose, /usr/bin/docker' | sudo tee /etc/sudoers.d/docker
sudo chmod 0440 /etc/sudoers.d/docker

echo ""
echo "✅ Configuration terminée !"
echo "🧪 Test de la configuration..."
sudo docker ps > /dev/null 2>&1 && echo "✅ Sudo fonctionne sans mot de passe !" || echo "❌ Erreur de configuration"
ENDSSH

echo ""
echo "✅ Configuration terminée sur le NAS !"
echo "Vous pouvez maintenant déployer sans mot de passe avec:"
echo "  ./deploy/deploy-synology.sh"
