# 🔌 Connexion DBeaver à la DB PROD

## ✅ Configuration finale (06/12/2025)

Le port PostgreSQL 5433 a été **exposé** sur le NAS via `docker-compose.shared.yml`.

### Paramètres de connexion DBeaver

```
Type:      PostgreSQL
Hôte:      192.168.1.199
Port:      5433
Base:      postgres
User:      postgres
Pass:      <voir .env.synology - DB_PASSWORD>
```

**URL JDBC:**
```
jdbc:postgresql://192.168.1.199:5433/postgres
```

### 🟢 Couleur de connexion

Configurez la connexion en **VERT** dans DBeaver pour rappeler que c'est PROD.

### ⚠️ Règles de sécurité PROD

- ⛔ **PAS** de DROP/TRUNCATE sans backup
- ⛔ **PAS** de modifications directes des données utilisateur  
- ✅ Toujours tester sur DEV d'abord
- ✅ Backup AVANT toute modification
- ✅ Utiliser les scripts de migration (`/backend/migrations/`)

## 🔧 Modifications apportées

### Fichier modifié: `deploy/docker-compose.shared.yml`

```yaml
services:
  db:
    image: postgres:15-alpine
    container_name: pokedec-blue-green-db
    ports:
      - "5433:5432"  # ← AJOUTÉ
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=postgres
    volumes:
      - pokedec-shared-db-data:/var/lib/postgresql/data
    restart: always
    networks:
      - shared-net
```

### Commandes de déploiement

```bash
# Copier le fichier sur le NAS
cat deploy/docker-compose.shared.yml | ssh -p 596 eugenio@192.168.1.199 \
  "cat > /volume1/docker/pokedec-shared/docker-compose.yml"

# Redémarrer le conteneur
ssh -p 596 eugenio@192.168.1.199 \
  "cd /volume1/docker/pokedec-shared && sudo /usr/local/bin/docker-compose up -d"
```

## 🧪 Tests de connectivité

```bash
# Tester le port
nc -zv 192.168.1.199 5433

# Vérifier les conteneurs
ssh -p 596 eugenio@192.168.1.199 "docker ps"
```

## 📚 Voir aussi

- `DBEAVER_QUICK_REFERENCE.txt` - Référence rapide
- `DBEAVER_CONFIGURATION.md` - Configuration détaillée
- `.env.synology` - Variables d'environnement NAS
