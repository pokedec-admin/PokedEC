# Déploiement Poked'EC

Ce dossier contient les scripts pour déployer l'application `ng-PokedEC` sur les différents environnements.

## Architecture

L'application supporte 3 environnements distincts :

1.  **DEV (localhost)** : Pour le développement local avec Docker Compose.
2.  **NAS (Serveur Synology)** : Serveur local de backup. Le frontend Angular est pré-compilé (si poussé via DockerHub) ou récupéré via GitHub Actions, et l'application tourne via Container Manager.
3.  **CLOUD (GitHub CI/CD)** : Environnement de production hébergé sur Supabase, Render et Vercel.

## Prérequis (NAS)

1.  **SSH Activé** sur le NAS.
2.  **Docker / Container Manager** installé sur le NAS.
3.  Fichier `.env.synology` correctement rempli.

## Utilisation

Depuis la racine du projet :

```bash
./deploy/deploy.sh dev    # Déploie localement pour les tests
./deploy/deploy.sh nas    # Transfère et déploie sur le NAS
./deploy/deploy.sh cloud  # Crée une branche de release pour la CI/CD
```

Le script va :
1.  **Valider l'environnement cible**.
2.  **Incrémenter la version** automatiquement dans les fichiers de configuration (frontend/backend).
3.  *(Pour NAS)* : Transférer les ressources nécessaires au NAS et redémarrer les conteneurs.
4.  *(Pour CLOUD)* : Créer une branche de diffusion (release), créer un commit et un tag de version, puis pousser sur GitHub pour déclencher la CI/CD. **Une Pull Request devra ensuite être créée.**

## CI/CD et Versioning

Pour protéger la branche `main`, le script n'y pousse plus directement.
Lors de l'utilisation de la commande pour le cloud (`./deploy/deploy.sh cloud`), le script génère automatiquement :
- La montée de version.
- Une nouvelle branche nommée `release/VYYYY.MM.DD.x`.
- Un tag annoté pour la version.

Créez ensuite une Pull Request de cette branche vers `main` sur GitHub.
