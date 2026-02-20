# Déploiement sur Synology NAS

Ce dossier contient les scripts pour déployer l'application `ng-PokedEC` sur votre NAS Synology.

## Architecture

L'application utilise une architecture optimisée pour le NAS :

1.  **Base de Données Partagée** : Un seul conteneur `pokedec-blue-green-db` sert les environnements BLUE et GREEN.
2.  **Frontend Pré-compilé** : Le frontend Angular est compilé localement (`frontend-dist`) et servi par Nginx (fichiers statiques) sur le NAS, réduisant la charge CPU du NAS.
3.  **Blue-Green Deployment** : Deux environnements parallèles pour des mises à jour sans interruption.

## Prérequis

1.  **SSH Activé** sur le NAS (Port 6674).
2.  **Docker / Container Manager** installé sur le NAS.
3.  **Clé SSH** configurée pour une connexion sans mot de passe.
4.  **Sudo sans mot de passe** pour les commandes Docker.
5.  **Infrastructure Partagée** initialisée (voir ci-dessous).

## Initialisation (Une seule fois)

Avant le premier déploiement, initialisez le réseau et la base de données partagée :

```bash
./deploy/init-shared-db.sh
```

## Utilisation

### Via l'Interface Admin (Recommandé)

1.  Connectez-vous à l'environnement **DEV** en tant qu'administrateur.
2.  Sur la page d'accueil, utilisez les boutons **"Déployer sur BLUE"** ou **"Déployer sur GREEN"**.
3.  Suivez l'avancement via le Monitoring.

### Via Ligne de Commande

Depuis la racine du projet :

```bash
./deploy/deploy-synology.sh blue   # Déploie sur BLUE (port 8081)
./deploy/deploy-synology.sh green  # Déploie sur GREEN (port 8080)
```

Le script va :
1.  **Compiler le frontend** localement (dossier `frontend-dist`).
2.  **Incrémenter la version** automatiquement.
3.  **Transférer** les fichiers (backend, frontend compilé, config Nginx) sur le NAS.
4.  **Lancer** les conteneurs sur le NAS en utilisant la DB partagée.

## Monitoring

Le dashboard de monitoring (Page Home Admin) permet de :
- Voir le statut et la version de DEV, BLUE, GREEN et PUBLIC.
- Déployer vers BLUE/GREEN.
- Basculer l'environnement PUBLIC (nécessite configuration proxy).

## Dépannage

- **Erreur de build frontend** : Vérifiez que `npm install` a été fait dans le dossier `frontend`.
- **Erreur SSH** : Vérifiez que votre clé SSH est bien chargée (`ssh-add -l`) et que vous pouvez vous connecter au NAS sans mot de passe.
- **Base de données** : Si la DB partagée ne répond pas, lancez `./deploy/init-shared-db.sh` pour vérifier son état.
