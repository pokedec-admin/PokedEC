# 🛠️ Walkthrough : Configuration de Poked'EC

Ce guide détaille comment configurer les trois environnements du projet.

## 📁 Fichiers de Configuration

Le projet utilise trois fichiers `.env` principaux :

1.  **`.env`** (à la racine) : Utilisé pour le développement local (DEV) avec Docker.
2.  **`.env.synology`** : Utilisé pour le déploiement sur le NAS Synology (NAS).
3.  **Variables d'Environnement CLOUD** : Configuré sur Vercel (Frontend) et Render (Backend).
4.  **`.env.local`** : Optionnel, pour vos configurations spécifiques de développement.

## 🚀 Étapes de Configuration

### 1. Environnement de Développement (DEV)
- Copiez `.env.example` en `.env`.
- Les valeurs par défaut fonctionnent généralement avec `docker-compose up`.

- Assurez-vous que `DATABASE_URL` pointe vers votre instance PostgreSQL.
- **Déploiement** : Utilisez `./deploy/deploy.sh` pour automatiser la montée en version, le tagging Git et le déploiement sur le NAS et le CLOUD.

### 3. Synchronisation Supabase (Failover)
- Pour que le basculement automatique fonctionne, vous devez renseigner les clés Supabase dans vos fichiers `.env`.
- Consultez `SUPABASE_CONFIG_GUIDE.md` pour obtenir ces clés.

## 📡 Nouvelles Fonctionnalités Performance

### Observabilité (Winston & Morgan)
Le backend utilise désormais Winston pour une journalisation structurée. En développement, les logs sont colorés et lisibles ; en production, ils sont optimisés pour l'analyse. Morgan enregistre tous les appels HTTP pour faciliter le debugging.

### Service Worker (PWA)
L'application est installable sur mobile et bureau. Elle met en cache les données critiques pour permettre une consultation rapide même sans réseau.

---
*Dernière mise à jour : 13 Mars 2026*
