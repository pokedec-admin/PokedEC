# 🛠️ Walkthrough : Configuration de Poked'EC

Ce guide détaille comment configurer les trois environnements du projet.

## 📁 Fichiers de Configuration

Le projet utilise trois fichiers `.env` principaux :

1.  **`.env`** (à la racine) : Utilisé pour le développement local (DEV) avec Docker.
2.  **`.env.synology`** : Utilisé pour le déploiement sur le NAS Synology (NAS).
3.  **Variable Environnement Vercel/Render** : Utilisé pour le CLOUD.

## 🚀 Étapes de Configuration

### 1. Environnement de Développement (DEV)
- Copiez `.env.example` en `.env`.
- Les valeurs par défaut fonctionnent généralement avec `docker-compose up`.

### 2. Environnement NAS (Production / Backup)
- Éditez `.env.synology`.
- Configurez `NAS_IP`, `NAS_USER`, et `NAS_PASSWORD`.
- Assurez-vous que `DATABASE_URL` pointe vers votre instance PostgreSQL (locale ou Supabase).

### 3. Synchronisation Supabase (Failover)
- Pour que le basculement automatique fonctionne, vous devez renseigner les clés Supabase dans vos fichiers `.env`.
- Consultez `SUPABASE_CONFIG_GUIDE.md` pour obtenir ces clés.

## 📡 Nouvelles Fonctionnalités Performance

### Indicateur Réseau
L'application surveille en permanence la route `/system/status` pour détecter si le backend est disponible. 
- 🟢 **Vert** : Tout va bien.
- 🟡 **Orange** : Le backend est en train de sortir de veille (Cold Start).
- 🔴 **Rouge** : Vous êtes hors ligne ou le serveur est injoignable.

### Service Worker (PWA)
L'application est installable sur mobile et bureau. Elle met en cache les données critiques pour permettre une consultation rapide même sans réseau.

---
*Dernière mise à jour : 13 Mars 2026*
