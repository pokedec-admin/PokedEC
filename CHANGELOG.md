# Journal des modifications

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
et ce projet respecte le [Versionnement Sémantique](https://semver.org/spec/v2.0.0.html).

## [V2026.03.07.2] - 2026-03-07

### Ajouté
- Authentification à deux facteurs (2FA/TOTP) optionnelle pour les administrateurs (via `speakeasy`).
- Rotation des jetons de rafraîchissement (Refresh Token Rotation) pour une sécurité accrue des sessions.
- Implémentation des en-têtes de sécurité via `helmet` (CSP, HSTS).
- Gestion robuste des images avec `sharp` (redimensionnement) et `file-type` (validation MIME).
- Documentation API avec Swagger UI (accessible sur `/api-docs`).
- Intégration de Sentry pour le suivi des erreurs en temps réel.
- Infrastructure de tests unitaires avec Jest.
- Premiers tests unitaires backend pour les routes d'authentification.
- Thème "Mode Nuit" (Dark Mode) avec persistance locale.

### Changé
- Migration de `otplib` vers `speakeasy` pour une meilleure compatibilité ESM/CommonJS dans l'environnement Docker.
- Port par défaut du backend changé à 3000 pour s'aligner sur la configuration Nginx.
- Configuration CORS affinée pour les environnements de production et Vercel.
- Optimisation des requêtes database avec de nouveaux index B-tree.
- Amélioration du script d'importation pour synchroniser les buckets de stockage Supabase.

### Corrigé
- Erreur 502 Bad Gateway sur DEV grâce à l'alignement des ports backend/Nginx.
- Activation et affichage du Mode Nuit (CSS variables).
- Logique de détection d'environnement pour DEV, NAS et CLOUD.
- Visibilité du pied de page pour les utilisateurs non authentifiés.
- Incohérences d'URL dans le système de surveillance.
