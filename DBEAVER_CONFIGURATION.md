# Guide de Configuration DBeaver pour Poked'EC

Ce guide vous explique comment configurer DBeaver pour vous connecter aux différentes bases de données du projet Poked'EC.

## 📋 Vue d'ensemble des environnements

Le projet Poked'EC utilise trois environnements principaux :

| Environnement | Localisation | Port | Description |
|---------------|--------------|------|-------------|
| **DEV** | Localhost | 5434 | Développement local |
| **BLUE** | NAS Synology | 5433 | Production Blue (NAS) |
| **GREEN** | NAS Synology | 5433 | Production Green (NAS - BD partagée avec Blue) |

> **Note importante** : Les environnements BLUE et GREEN partagent la même base de données PostgreSQL sur le NAS (port 5433). Ils représentent deux versions différentes de l'application pointant vers la même base de données.

## 🔧 Configuration de DBeaver

### Prérequis

1. Télécharger et installer DBeaver : [https://dbeaver.io/download/](https://dbeaver.io/download/)
2. Avoir accès au réseau local (pour BLUE/GREEN)
3. Connaître l'adresse IP du NAS Synology (par défaut : `192.168.1.199`)

---

## 📝 Configuration - Environnement DEV (Localhost)

### Informations de connexion

```
Host:     localhost
Port:     5434
Database: postgres
User:     postgres
Password: postgres
```

### Étapes de configuration dans DBeaver

1. **Ouvrir DBeaver** et cliquer sur l'icône "Nouvelle connexion" (ou `Ctrl+N` / `Cmd+N`)

2. **Sélectionner PostgreSQL**
   - Dans la liste des bases de données, sélectionner `PostgreSQL`
   - Cliquer sur "Suivant"

3. **Remplir les paramètres de connexion**
   - **Hôte** : `localhost`
   - **Port** : `5434`
   - **Base de données** : `postgres`
   - **Nom d'utilisateur** : `postgres`
   - **Mot de passe** : `postgres`
   - Cocher "Enregistrer le mot de passe localement"

4. **Tester la connexion**
   - Cliquer sur "Tester la connexion..."
   - Si c'est la première fois, DBeaver téléchargera les drivers PostgreSQL
   - Vérifier que le message "Connecté" apparaît

5. **Nommer la connexion** (onglet "Général")
   - Nom suggéré : `Poked'EC - DEV`
   - Couleur suggérée : Bleu clair

6. **Finaliser**
   - Cliquer sur "Terminer"

### URL de connexion JDBC (avancé)
```
jdbc:postgresql://localhost:5434/postgres
```

---

## 🌐 Configuration - Environnement BLUE/GREEN (Production NAS)

### Informations de connexion

```
Host:     192.168.1.199
Port:     5433
Database: postgres
User:     postgres
Password: <voir .env.synology>
```

> ⚠️ **Important** : Le mot de passe de production n'est pas stocké dans ce document pour des raisons de sécurité. Veuillez consulter le fichier `.env.synology` (localement) ou demander l'accès à l'administrateur système.

### Étapes de configuration dans DBeaver

1. **Ouvrir DBeaver** et cliquer sur l'icône "Nouvelle connexion"

2. **Sélectionner PostgreSQL**

3. **Remplir les paramètres de connexion**
   - **Hôte** : `192.168.1.199`
   - **Port** : `5433`
   - **Base de données** : `postgres`
   - **Nom d'utilisateur** : `postgres`
   - **Mot de passe** : `<voir .env.synology>`
   - Cocher "Enregistrer le mot de passe localement"

4. **Tester la connexion**
   - Cliquer sur "Tester la connexion..."
   - Vérifier que le message "Connecté" apparaît
   - Si la connexion échoue, vérifier :
     - Que vous êtes sur le même réseau local que le NAS
     - Que le pare-feu ne bloque pas le port 5433
     - Que les conteneurs Docker sont bien démarrés sur le NAS

5. **Nommer la connexion** (onglet "Général")
   - Nom suggéré : `Poked'EC - PROD (BLUE/GREEN)`
   - Couleur suggérée : Vert pour production

6. **Finaliser**
   - Cliquer sur "Terminer"

### URL de connexion JDBC (avancé)
```
jdbc:postgresql://192.168.1.199:5433/postgres
```

---

## 🎨 Organisation recommandée dans DBeaver

### Créer un dossier de projet

1. Dans l'explorateur de connexions, cliquer droit → "Créer dossier"
2. Nommer le dossier : `Poked'EC`
3. Glisser-déposer vos connexions dans ce dossier

### Code couleur suggéré

- **DEV** : 🔵 Bleu clair (développement actif)
- **PROD (BLUE/GREEN)** : 🟢 Vert (production - attention!)

---

## 🔍 Vérification de la configuration

### Pour DEV

Exécuter cette requête pour vérifier la connexion :

```sql
SELECT 
    current_database() as database_name,
    version() as postgres_version,
    current_user as connected_user;
```

Vérifier également les tables principales :

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

Vous devriez voir les tables : `pokemon`, `users`, `pokedex`, `trades`, etc.

### Pour BLUE/GREEN (Production)

⚠️ **Attention** : Vous êtes connecté à la base de données de production partagée par BLUE et GREEN.

Exécuter la même requête de vérification :

```sql
SELECT 
    current_database() as database_name,
    version() as postgres_version,
    current_user as connected_user;
```

> **Rappel important** : Toute modification sur cette base affectera à la fois BLUE et GREEN!

---

## ⚠️ Bonnes pratiques de sécurité

### En développement (DEV)

- ✅ Vous pouvez modifier, supprimer, tester librement
- ✅ Vous pouvez faire des `DROP TABLE`, `TRUNCATE`, etc.
- ✅ La base peut être réinitialisée à tout moment

### En production (BLUE/GREEN)

- ⛔ **NE JAMAIS** faire de `DROP TABLE` ou `TRUNCATE` sans backup
- ⛔ **NE JAMAIS** modifier directement les données utilisateur en production
- ✅ Toujours faire un backup avant toute migration
- ✅ Utiliser les scripts de migration dans `/backend/migrations/`
- ✅ Tester d'abord sur DEV, puis déployer sur PROD

### Scripts de backup recommandés

#### Backup de DEV
```bash
# Depuis le répertoire du projet
docker exec -t ng-pokedec-db-1 pg_dump -U postgres postgres > backup_dev_$(date +%Y%m%d_%H%M%S).sql
```

#### Backup de PROD (depuis le NAS via SSH)
```bash
# Depuis votre machine locale
ssh <user>@192.168.1.199 "docker exec -t pokedec-blue-green-db pg_dump -U postgres postgres" > backup_prod_$(date +%Y%m%d_%H%M%S).sql
```

---

## 🛠️ Dépannage

### Problème : "Connection refused" sur DEV

**Causes possibles** :
- Les conteneurs Docker ne sont pas démarrés
- Le port 5434 est déjà utilisé par une autre application

**Solutions** :
```bash
# Vérifier que les conteneurs sont en cours d'exécution
docker ps

# Redémarrer les conteneurs si nécessaire
cd /Users/eugenio/ECDEV/ng-PokedEC
docker-compose up -d
```

### Problème : "Connection refused" sur PROD

**Causes possibles** :
- Pas de connexion réseau au NAS
- Conteneurs Docker arrêtés sur le NAS
- Port 5433 bloqué par le pare-feu

**Solutions** :
```bash
# Vérifier la connexion réseau
ping 192.168.1.199

# Se connecter au NAS et vérifier les conteneurs
ssh <user>@192.168.1.199
docker ps | grep pokedec
```

### Problème : "Driver PostgreSQL non trouvé"

**Solution** :
- DBeaver téléchargera automatiquement les drivers lors du premier test de connexion
- Si le téléchargement échoue, aller dans `Base de données` → `Gestionnaire de drivers` → `PostgreSQL` → `Télécharger`

---

## 📚 Ressources complémentaires

### Documentation du projet

- **API Documentation** : Voir `API_DOCUMENTATION.md`
- **Base de données** : Voir `database_schema.md`
- **Configuration des environnements** : Voir `Configuration Environnements.md`
- **Déploiement** : Voir `deploy/README.md`

### Liens utiles

- **DBeaver Documentation** : [https://dbeaver.com/docs/](https://dbeaver.com/docs/)
- **PostgreSQL Documentation** : [https://www.postgresql.org/docs/](https://www.postgresql.org/docs/)
- **Application DEV** : [http://localhost:8081](http://localhost:8081)
- **Application BLUE** : [http://192.168.1.199:8081](http://192.168.1.199:8081)
- **Application GREEN** : [http://192.168.1.199:8080](http://192.168.1.199:8080)
- **Application PUBLIC** : [https://poke.fec.ch](https://poke.fec.ch)

---

## 📞 Support

En cas de problème :

1. Vérifier ce guide de dépannage
2. Consulter les logs des conteneurs : `docker logs <container_name>`
3. Vérifier le fichier `Configuration Environnements.md`
4. Contacter l'administrateur système

---

**Dernière mise à jour** : 2025-12-05  
**Version du document** : 1.0
