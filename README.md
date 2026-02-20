# Poked'EC — Pokémon GO Community Tool

Poked'EC est une application web fullstack (Angular/Node.js/PostgreSQL) conçue pour aider les dresseurs de Pokémon GO à suivre leur Pokédex, leurs variantes (Shiny, Lucky, XXL, etc.) et à organiser des échanges avec d'autres membres de la communauté.

## 🚀 Architecture de Déploiement

L'application est configurée pour un déploiement robuste :
- **Frontend** : Angular (Vercel ou Nginx)
- **Backend** : Node.js (Render ou Docker)
- **Base de données** : PostgreSQL (Supabase ou Docker local)
- **CI/CD** : Script `deploy/deploy-synology.sh` pour environnements BLUE/GREEN.

## 🛠️ Configuration (Variables d'Environnement)

Pour faire fonctionner l'application, créez un fichier `.env` ou configurez les variables suivantes sur votre plateforme d'hébergement :

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
