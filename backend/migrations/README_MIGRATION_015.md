# Migration 015: Suppression des colonnes redondantes dans la table `pokedex`

## 🎯 Objectif

Normaliser la base de données en supprimant les données dupliquées. Les colonnes suivantes sont supprimées de la table `pokedex` car elles existent déjà dans `pokemon_master` :

- `name` (VARCHAR)
- `name_fr` (VARCHAR)
- `name_en` (VARCHAR)
- `name_de` (VARCHAR)
- `name_it` (VARCHAR)
- `name_pt` (VARCHAR) 
- `image_url` (TEXT)

## 📊 Avantages

### ✅ Économie d'espace
- **Avant** : ~500 bytes par entrée pokedex (noms  + URL d'image)
- **Après** : ~0 bytes (données référencées via JOIN)
- **Économie** : jusqu'à 50% de l'espace disque pour la table pokedex

### ✅ Maintenabilité
- Une seule source de vérité pour les noms et images
- Mise à jour automatique pour tous les utilisateurs lors de corrections
- Pas de synchronisation nécessaire entre tables

### ✅ Intégrité des données
- Impossible d'avoir des noms incohérents entre utilisateurs
- Garantie que tous les utilisateurs voient les dernières données

## 📁 Fichiers modifiés

### Backend
1. **`backend/migrations/015_remove_redundant_pokedex_columns.sql`**
   - Script de migration pour supprimer les colonnes

2. **`backend/src/routes/pokedex.js`**
   - Toutes les requêtes SELECT utilisent maintenant des WHERE avec `pokemon_master`
   - INSERT simplifié (seulement `user_id` et `pokemon_id`)
   - Bulk-fill optimisé

3. **`backend/src/routes/admin-import.js`**
   - Import PROD→DEV adapté (ne copie plus les colonnes supprimées)

### Documentation
4. **`database_schema.md`**
   - Schéma mis à jour
   - Note explicative sur l'architecture normalisée

## 🚀 Exécution de la migration

### Environnement DEV (Local)

```bash
# 1. Se connecter à la DB locale
cd /Users/eugenio/ECDEV/ng-PokedEC
docker ps  # Vérifier que le conteneur tourne

# 2. Exécuter la migration
docker exec -i ng-pokedec-db-1 psql -U postgres postgres < backend/migrations/015_remove_redundant_pokedex_columns.sql

# 3. Vérifier la migration
docker exec -it ng-pokedec-db-1 psql -U postgres postgres -c "\d pokedex"

# 4. Redémarrer le backend pour charger le nouveau code
docker-compose restart backend
```

### Environnement PROD (Synology NAS)

⚠️ **IMPORTANT : Faire un backup AVANT** ⚠️

```bash
# 1. Backup de la DB PROD
ssh -p 596 eugenio@192.168.1.199 "sudo docker exec pokedec-blue-green-db pg_dump -U postgres postgres" > backup_prod_before_migration_015_$(date +%Y%m%d).sql

# 2. Copier le script de migration sur le NAS
scp -P 596 backend/migrations/015_remove_redundant_pokedex_columns.sql eugenio@192.168.1.199:/tmp/

# 3. Exécuter la migration
ssh -p 596 eugenio@192.168.1.199 "sudo docker exec -i pokedec-blue-green-db psql -U postgres postgres < /tmp/015_remove_redundant_pokedex_columns.sql"

# 4. Vérifier
ssh -p 596 eugenio@192.168.1.199 "sudo docker exec pokedec-blue-green-db psql -U postgres postgres -c '\\d pokedex'"

# 5. Redéployer le code mis à jour (BLUE ou GREEN selon environnement actif)
cd deploy
bash deploy-synology.sh
```

## ✅ Tests de validation

Après la migration, vérifier que :

### 1. Les données sont accessibles

```sql
-- Vérifier qu'on peut récupérer les noms via JOIN
SELECT p.pokemon_id, pm.name_fr, pm.image_url, p.has_shiny 
FROM pokedex p 
INNER JOIN pokemon_master pm ON p.pokemon_id = pm.pokemon_id 
LIMIT 5;
```

### 2. L'application fonctionne

- ✅ Page Pokédex affiche correctement les Pokemon
- ✅ Page Home affiche les activités récentes
- ✅ Page Trade affiche les Pokemon disponibles
- ✅ Ajout de Pokemon fonctionne
- ✅ Bulk fill fonctionne

### 3. Espace disque récupéré

```sql
-- Vérifier la taille de la table
SELECT pg_size_pretty(pg_total_relation_size('pokedex')) as table_size;
```

## 🔄 Rollback (si nécessaire)

Si des problèmes surviennent, vous pouvez restaurer le backup :

```bash
# DEV
cat backup_dev_before_migration.sql | docker exec -i ng-pokedec-db-1 psql -U postgres postgres

# PROD
cat backup_prod_before_migration_015_YYYYMMDD.sql | ssh -p 596 eugenio@192.168.1.199 "sudo docker exec -i pokedec-blue-green-db psql -U postgres postgres"
```

## 📝 Notes techniques

### Compatibilité ascendante

Le code backend est **rétro-compatible** :
- Les anciennes requêtes avec noms dans pokedex ont été migrées
- Toutes les requêtes utilisent maintenant des JOINs avec `pokemon_master`

### Performance

Impact minimal : 
- Les requêtes utilisent déjà des JOINs avec `pokemon_master`
- Index existants sur `pokemon_id` assurent des performances optimales
- La table `pokemon_master` est petite (~1025 lignes max)

### Migrations futures

Pour tout import ou script custom, utiliser uniquement :
```sql
INSERT INTO pokedex (user_id, pokemon_id, ...)
-- Pas de name, name_fr, name_en, name_de, name_it, image_url
```

## 👤 Auteur

Migration créée le 2025-12-06 pour normaliser la structure de la base de données.
