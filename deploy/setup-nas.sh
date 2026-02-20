#!/bin/bash
# One-time interactive setup script
# Run this ONCE to configure docker permissions

echo "======================================"
echo "  Configuration Docker sur NAS"
echo "======================================"
echo ""
echo "Ce script va vous connecter au NAS en SSH."
echo "Vous devrez entrer votre mot de passe NAS."
echo ""
echo "Appuyez sur Enter pour continuer..."
read

# Connect interactively and run all setup commands
ssh -p 6674 -t eugenio@192.168.1.199 << 'ENDSSH'
#!/bin/sh
echo "🔧 Configuration en cours..."
echo ""

# Method 1: Try to add user to docker group (if it exists)
if getent group docker > /dev/null 2>&1; then
    echo "📦 Ajout de l'utilisateur au groupe docker..."
    sudo usermod -aG docker eugenio
    echo "✅ Utilisateur ajouté au groupe docker"
else
    echo "⚠️  Groupe docker n'existe pas, configuration de sudo..."
    echo 'eugenio ALL=(ALL) NOPASSWD: /usr/local/bin/docker-compose, /usr/bin/docker' | sudo tee /etc/sudoers.d/docker
    sudo chmod 0440 /etc/sudoers.d/docker
    echo "✅ Sudo configuré"
fi

echo ""
echo "🚀 Démarrage des conteneurs..."
cd /volume1/docker/pokedec-prod

# Try without sudo first, fallback to sudo
if docker ps > /dev/null 2>&1; then
    echo "✅ Docker accessible sans sudo"
    /usr/local/bin/docker-compose down 2>/dev/null || true
    /usr/local/bin/docker-compose up -d --build
else
    echo "🔐 Utilisation de sudo..."
    sudo /usr/local/bin/docker-compose down 2>/dev/null || true
    sudo /usr/local/bin/docker-compose up -d --build
fi

echo ""
echo "📊 État des conteneurs:"
if docker ps > /dev/null 2>&1; then
    /usr/local/bin/docker-compose ps
else
    sudo /usr/local/bin/docker-compose ps
fi

echo ""
echo "======================================"
echo "✅ Configuration terminée !"
echo "======================================"
echo ""
echo "L'application devrait être accessible sur:"
echo "  https://192.168.1.199"
echo ""
echo "Pour les prochains déploiements, utilisez:"
echo "  ./deploy/deploy-synology.sh"
echo ""
ENDSSH

echo ""
echo "✅ Script terminé !"
