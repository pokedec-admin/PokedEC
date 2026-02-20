# Poked'EC — Pokémon GO Community Tool

Gérez votre collection personnelle de pokemon avec vos amis afin de facilité les échanges pour compléter vos pokedex

Poked'EC est une application web fullstack (Angular/Node.js/PostgreSQL) conçue pour aider les dresseurs de Pokémon GO à suivre leur Pokédex, leurs variantes (Shiny, Lucky, XXL, etc.) et à organiser des échanges avec d'autres membres de la communauté.

## 🚀 Architecture de Déploiement

Cette application est optimisée pour un déploiement Cloud moderne :
- **Frontend** : [Vercel](https://vercel.com) (Hébergement Angular SPA)
- **Backend** : [Render](https://render.com) (Serveur Node.js/Express)
- **Base de données** : [Supabase](https://supabase.com) (PostgreSQL managé)
- **Repo** : [GitHub](https://github.com/pokedec-admin/PokedEC)

## 🛠️ Configuration des Plateformes

### 1. Backend (Render)
Variables d'environnement à configurer sur Render :
- `DATABASE_URL` : URL de connexion complète de Supabase (ex: `postgres://postgres.xxxx:password@xxxx.supabase.co:5432/postgres`)
- `FRONTEND_URL` : URL de votre application sur Vercel (ex: `https://pokedec.vercel.app`)
- `JWT_SECRET` : Une chaîne de caractères longue et complexe pour sécuriser l'auth.
- `PORT` : (Géré par Render, mais vous pouvez le fixer à `3000`).
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `SMTP_FROM_NAME` : Pour les emails (voir `EMAIL_SETUP.md`).

### 2. Frontend (Vercel)
Variables d'environnement à configurer sur Vercel :
- `API_URL` : URL de votre serveur Render (ex: `https://pokedec-backend.onrender.com/api`)

### 3. Base de données (Supabase)
Aucune config spécifique, récupérez simplement la **Connection String** dans les paramètres du projet.

## 🛠️ Configuration Locale (Variables d'Environnement)

Pour faire fonctionner l'application en local, créez un fichier `.env.local` basé sur `.env.example`.

### Base de données (PostgreSQL)
- `DB_HOST` : Adresse de la base de données (ex: `localhost` ou URL Supabase)
- `DB_PORT` : Port (par défaut `5432`)
- `DB_USER` : Utilisateur
- `DB_PASSWORD` : Mot de passe
- `DB_NAME` : Nom de la base
- `DATABASE_URL` : (Optionnel) Chaîne de connexion complète (format Supabase/Render)

### Application
- `JWT_SECRET` : Clé secrète pour la signature des tokens d'authentification (Obligatoire)
- `NODE_ENV` : `development` ou `production`
- `PORT` : Port d'écoute du backend (par défaut `3000`)
- `API_URL` : URL de l'API backend pour le frontend
- `FRONTEND_URL` : URL du frontend pour la configuration CORS (Sécurité)

### Email (Verification & Notifs)
- `SMTP_HOST` : Serveur SMTP (ex: `smtp.gmail.com`)
- `SMTP_PORT` : Port (ex: `587`)
- `SMTP_USER` : Email d'expédition
- `SMTP_PASS` : Mot de passe d'application
- `SMTP_FROM` : Email affiché
- `SMTP_FROM_NAME` : Nom affiché (ex: `Poked'EC Community`)

### Déploiement NAS (Optionnel)
- `NAS_USER`, `NAS_IP`, `NAS_PORT` : Pour le script de déploiement automatique.

## 📦 Installation Locale

1. **Cloner le projet**
   ```bash
   git clone https://github.com/pokedec-admin/PokedEC.git
   cd PokedEC
   ```

2. **Backend**
   ```bash
   cd backend
   npm install
   # Configurer .env
   npm start
   ```

3. **Frontend**
   ```bash
   cd frontend
   npm install
   npm start
   ```

## 📜 Licence
Projet privé — Tous droits réservés.
