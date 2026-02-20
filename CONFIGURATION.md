# PokedEC - Configuration

## 🔧 Configuration Rapide

Ce projet utilise des fichiers `.env` pour gérer les configurations sensibles.

### Première Installation

1. **Copier le template de configuration** :
   ```bash
   cp .env.example .env.local
   ```

2. **Éditer `.env.local`** avec vos valeurs :
   - IP de votre NAS Synology
   - Credentials SSH
   - Mots de passe de base de données
   - Secrets JWT

3. **Démarrer l'application** :
   ```bash
   docker-compose up -d
   ```

### Déploiement sur Synology NAS

1. **Créer la configuration NAS** :
   ```bash
   cp .env.example .env.synology
   # Éditer avec vos valeurs de production
   ```

2. **Déployer** :
   ```bash
   ./deploy/deploy-synology.sh
   ```

## 📖 Documentation Complète

Voir [`walkthrough.md`](file:///.gemini/antigravity/brain/40b4f808-ee0f-4aa5-a63e-dd5ac7c95d9d/walkthrough.md) pour la documentation détaillée du système de configuration.

## ⚠️ Sécurité

> **IMPORTANT** : Ne JAMAIS committer les fichiers `.env.local` ou `.env.synology` dans Git !

Ces fichiers contiennent des informations sensibles et sont automatiquement ignorés par `.gitignore`.
