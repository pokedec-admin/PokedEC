# ✅ Checklist de Mise en Production du Système de Basculement

## 📋 Avant de Commencer

- [ ] J'ai lu `FAILOVER_SUMMARY.md`
- [ ] J'ai lu `SETUP_FAILOVER.md`
- [ ] J'ai un compte Supabase (gratuit ou payant)
- [ ] J'ai accès SSH au NAS
- [ ] J'ai Node.js installé localement

## 🎯 Étape 1 : Internalisation des Images (Optionnel)

- [ ] Créer le dossier `frontend/public/images/pokemon/`
- [ ] Lancer `node scripts/internalize_images.js`
- [ ] Vérifier que ~1000 images ont été téléchargées
- [ ] Vérifier qu'une image s'affiche : `ls frontend/public/images/pokemon/ | head`
- [ ] Tester l'affichage dans l'application

**Temps estimé** : 10 minutes

## 🔧 Étape 2 : Configuration Supabase

### 2.1 Création du Projet
- [ ] Créer un compte sur https://supabase.com
- [ ] Créer un nouveau projet
- [ ] Choisir un nom et un mot de passe fort
- [ ] Sélectionner la région (Europe West recommandé)
- [ ] Attendre la fin de la création (~2 minutes)

### 2.2 Récupération des Credentials
- [ ] Aller dans Settings → Database
- [ ] Noter le Host : `db.xxx.supabase.co`
- [ ] Noter le Password (celui choisi à la création)
- [ ] Aller dans Settings → API
- [ ] Noter l'URL de l'API REST
- [ ] Noter la clé `anon` (publique)

### 2.3 Configuration Locale
- [ ] Copier `.env.supabase.example` vers `.env.supabase`
- [ ] Remplir les credentials Supabase
- [ ] Ajouter les mêmes credentials dans `.env.synology`
- [ ] Vérifier que `.env.supabase` est dans .gitignore

**Temps estimé** : 15 minutes

## 📊 Étape 3 : Import du Schéma

### 3.1 Export depuis le NAS
```bash
ssh -p 596 eugenio@192.168.1.199
docker exec ng-pokedec-db-1 pg_dump -U postgres --schema-only postgres > /tmp/schema.sql
exit
```

- [ ] Commande exécutée sans erreur
- [ ] Fichier `/tmp/schema.sql` créé

### 3.2 Récupération Locale
```bash
scp -P 596 eugenio@192.168.1.199:/tmp/schema.sql .
```

- [ ] Fichier `schema.sql` téléchargé localement
- [ ] Taille du fichier > 0 octets

### 3.3 Import vers Supabase
```bash
PGPASSWORD=votre_password psql -h db.xxx.supabase.co -U postgres -d postgres < schema.sql
```

- [ ] Import réussi sans erreur critique
- [ ] Vérifier dans Supabase Dashboard → Table Editor
- [ ] Tables visibles : `users`, `pokemon_master`, `pokedex`, etc.

**Temps estimé** : 10 minutes

## 🔄 Étape 4 : Test de Synchronisation

### 4.1 Synchronisation Manuelle
```bash
./scripts/sync_to_supabase.sh
```

- [ ] Script exécuté sans erreur
- [ ] Message "✅ Synchronisation réussie !"
- [ ] Vérifier dans Supabase que les données sont présentes

### 4.2 Vérification des Données
```bash
# Compter les utilisateurs
PGPASSWORD=xxx psql -h db.xxx.supabase.co -U postgres -c "SELECT COUNT(*) FROM users;"
```

- [ ] Nombre d'utilisateurs correspond au NAS
- [ ] Données cohérentes

**Temps estimé** : 5 minutes

## 🌐 Étape 5 : Configuration Frontend

### 5.1 Mise à Jour des Environnements
- [ ] Éditer `frontend/src/environments/environment.prod.ts`
- [ ] Remplacer `backupApiUrl` par l'URL Supabase
- [ ] Vérifier que l'URL se termine par `/rest/v1`

### 5.2 Vérification de l'Intercepteur
- [ ] Ouvrir `frontend/src/app/app.config.ts`
- [ ] Vérifier que `failoverInterceptor` est dans la liste
- [ ] Vérifier l'import du service

### 5.3 Compilation
```bash
cd frontend
npm run build -- --configuration production
```

- [ ] Compilation réussie sans erreur
- [ ] Dossier `dist/` créé

**Temps estimé** : 5 minutes

## 🚀 Étape 6 : Déploiement

### 6.1 Déploiement sur BLUE
```bash
./deploy/deploy-synology.sh blue
```

- [ ] Tests backend passés
- [ ] Tests frontend passés
- [ ] Déploiement réussi
- [ ] Application accessible sur http://192.168.1.199:8081

### 6.2 Déploiement sur GREEN
```bash
./deploy/deploy-synology.sh green
```

- [ ] Tests passés
- [ ] Déploiement réussi
- [ ] Application accessible sur http://192.168.1.199:8080

**Temps estimé** : 10 minutes

## 🧪 Étape 7 : Tests de Basculement

### 7.1 Test du Basculement Automatique
- [ ] Ouvrir l'application dans le navigateur
- [ ] Ouvrir la console développeur (F12)
- [ ] Arrêter le backend : `docker-compose stop backend`
- [ ] Tenter une action (ex: se connecter)
- [ ] Vérifier dans la console : "⚠️ Switching to Backup API..."
- [ ] Vérifier que l'action réussit
- [ ] Vérifier dans localStorage : `pokedec_use_backup = true`

### 7.2 Test du Retour au Primaire
- [ ] Redémarrer le backend : `docker-compose start backend`
- [ ] Attendre 1 minute (health check)
- [ ] Vérifier la notification de retour
- [ ] Accepter le basculement
- [ ] Vérifier que l'application fonctionne
- [ ] Vérifier dans localStorage : `pokedec_use_backup` absent

### 7.3 Test Manuel
- [ ] Dans la console : `localStorage.setItem('pokedec_use_backup', 'true')`
- [ ] Recharger la page
- [ ] Vérifier que les requêtes vont vers Supabase
- [ ] Revenir au mode normal

**Temps estimé** : 15 minutes

## 📅 Étape 8 : Synchronisation Automatique

### 8.1 Configuration
```bash
./scripts/setup_auto_sync.sh
```

- [ ] Script exécuté
- [ ] Fréquence choisie (recommandé : toutes les heures)
- [ ] Tâche cron créée

### 8.2 Vérification
```bash
crontab -l
```

- [ ] Ligne visible avec `sync_to_supabase.sh`
- [ ] Fréquence correcte

### 8.3 Test
- [ ] Attendre la prochaine exécution OU
- [ ] Lancer manuellement : `./scripts/sync_to_supabase.sh`
- [ ] Vérifier les logs : `tail -f /var/log/pokedec_sync.log`

**Temps estimé** : 5 minutes

## 🎨 Étape 9 : Widget Admin (Optionnel)

### 9.1 Ajout du Composant
- [ ] Éditer `frontend/src/app/pages/admin/home/home.html`
- [ ] Ajouter `<app-failover-status></app-failover-status>`
- [ ] Éditer `frontend/src/app/pages/admin/home/home.ts`
- [ ] Importer `FailoverStatusComponent`

### 9.2 Test
- [ ] Recompiler le frontend
- [ ] Redéployer
- [ ] Vérifier que le widget s'affiche
- [ ] Tester le bouton de basculement

**Temps estimé** : 10 minutes

## 📊 Étape 10 : Monitoring

### 10.1 Métriques de Base
- [ ] Vérifier la taille de la DB : Supabase Dashboard
- [ ] Vérifier l'utilisation : Settings → Usage
- [ ] Noter la baseline pour comparaison future

### 10.2 Alertes (Optionnel)
- [ ] Configurer un webhook Slack/Discord
- [ ] Tester les notifications
- [ ] Documenter le processus

**Temps estimé** : 10 minutes

## ✅ Validation Finale

### Checklist de Production
- [ ] Application fonctionne en mode normal (NAS)
- [ ] Basculement automatique fonctionne
- [ ] Retour au primaire fonctionne
- [ ] Synchronisation automatique configurée
- [ ] Logs accessibles et lisibles
- [ ] Widget admin visible (si installé)
- [ ] Documentation à jour
- [ ] Credentials sécurisés (pas dans Git)

### Tests de Charge (Optionnel)
- [ ] Simuler 10 utilisateurs simultanés
- [ ] Vérifier la latence NAS vs Supabase
- [ ] Vérifier la consommation de ressources

### Documentation
- [ ] Créer un document de procédure d'urgence
- [ ] Former l'équipe admin
- [ ] Documenter les contacts Supabase

## 🎉 Mise en Production

- [ ] Basculer PUBLIC vers BLUE ou GREEN
- [ ] Surveiller les logs pendant 24h
- [ ] Vérifier les métriques Supabase
- [ ] Confirmer que tout fonctionne

## 📞 En Cas de Problème

### Rollback Rapide
Si quelque chose ne va pas :

```bash
# Désactiver le basculement
localStorage.removeItem('pokedec_use_backup');

# Ou revenir à la version précédente
./deploy/deploy-synology.sh blue  # ou green
```

### Support
1. Consulter les logs
2. Vérifier `FAILOVER_SUMMARY.md`
3. Tester manuellement chaque composant
4. Contacter le support Supabase si nécessaire

## 📈 Après la Mise en Production

### Semaine 1
- [ ] Surveiller les logs quotidiennement
- [ ] Vérifier la synchronisation
- [ ] Noter les métriques de performance

### Mois 1
- [ ] Analyser les basculements (combien ? pourquoi ?)
- [ ] Optimiser la fréquence de sync si nécessaire
- [ ] Ajuster les alertes

### Trimestre 1
- [ ] Évaluer les coûts Supabase
- [ ] Décider si upgrade vers plan Pro nécessaire
- [ ] Planifier les améliorations

---

**Temps total estimé** : 1h30 - 2h00

**Niveau de difficulté** : Intermédiaire

**Prérequis techniques** : Connaissance de base en PostgreSQL, Docker, et ligne de commande
