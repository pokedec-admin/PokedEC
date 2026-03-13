#!/bin/bash
# ============================================================
#  Poked'EC — Script de Déploiement Synology NAS
#  Cibles : DEV (localhost) · NAS (NAS:8080)
#  Containers nommés : pokedec-<env>-{frontend,backend,nginx,db}
# ============================================================

set -e   # Stop on first error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# --- 1. Validate target environment ---
TARGET_ENV="${1:-nas}"
TARGET_ENV=$(echo "$TARGET_ENV" | tr '[:upper:]' '[:lower:]')

if [[ "$TARGET_ENV" != "dev" && "$TARGET_ENV" != "nas" && "$TARGET_ENV" != "cloud" ]]; then
    echo "❌ Erreur: Cible invalide. Utilisez 'dev', 'nas' ou 'cloud'."
    echo "   Usage: ./deploy-synology.sh [dev|nas|cloud]"
    exit 1
fi

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║          Poked'EC — Déploiement Fullstack            ║"
echo "╚══════════════════════════════════════════════════════╝"

# --- 2. Load Synology env vars (not needed for DEV) ---
if [ "$TARGET_ENV" != "dev" ]; then
    OVERRIDE_NAS_PORT="$NAS_PORT"
    if ! source "$SCRIPT_DIR/load-env.sh" "$PROJECT_ROOT/.env.synology"; then
        exit 1
    fi
    if [ -n "$OVERRIDE_NAS_PORT" ]; then
        NAS_PORT="$OVERRIDE_NAS_PORT"
        echo "⚠️  NAS_PORT surchargé : $NAS_PORT"
    fi
fi

# --- 3. Set per-environment configuration ---
if [ "$TARGET_ENV" == "cloud" ]; then
    APP_ENV_VALUE="CLOUD"
    ENV_SUFFIX="cloud"
    echo "☁️   Cible : CLOUD (GitHub CI/CD)"
elif [ "$TARGET_ENV" == "nas" ]; then
    NAS_PATH="/volume1/docker/pokedec-nas"
    FRONTEND_PORT="8080" 
    APP_ENV_VALUE="NAS"
    ENV_SUFFIX="nas"
    echo "🏗️   Cible : NAS   →  NAS:${FRONTEND_PORT}  →  ${NAS_PATH}"
else
    FRONTEND_PORT="8080"
    APP_ENV_VALUE="DEV"
    ENV_SUFFIX="dev"
    echo "🟠  Cible : DEV   →  localhost:${FRONTEND_PORT}"
fi

# --- 4. Auto-Increment Version ---
ENV_FILE="$PROJECT_ROOT/frontend/src/environments/environment.prod.ts"
ENV_DEV_FILE="$PROJECT_ROOT/frontend/src/environments/environment.ts"
DATE=$(date +%Y.%m.%d)

CURRENT_VERSION=$(grep "version:" "$ENV_FILE" | sed "s/.*'V\(.*\)'.*/\1/")
TODAY_PREFIX="${DATE}"

if [[ "$CURRENT_VERSION" == "$TODAY_PREFIX"* ]]; then
    LAST_BUILD=$(echo "$CURRENT_VERSION" | awk -F. '{print $4}')
    NEW_BUILD=$((LAST_BUILD + 1))
    NEW_VERSION="V${TODAY_PREFIX}.${NEW_BUILD}"
else
    NEW_VERSION="V${TODAY_PREFIX}.1"
fi

echo "🔖  Version : ${CURRENT_VERSION} → ${NEW_VERSION}"

# Update both environment files
sed -i '' "s/version: '.*'/version: '$NEW_VERSION'/" "$ENV_FILE"
sed -i '' "s/version: '.*'/version: '$NEW_VERSION'/" "$ENV_DEV_FILE"

# ============================================================
#   DÉPLOIEMENT CLOUD (GITHUB)
# ============================================================
if [ "$TARGET_ENV" == "cloud" ]; then
    echo ""
    echo "☁️   Sauvegarde et Déploiement sur GitHub (CLOUD)…"
    cd "$PROJECT_ROOT"
    
    # S'assurer que les fichiers de version sont inclus
    git add .
    
    if git diff --cached --quiet; then
        echo "⚠️  Aucun changement détecté à pousser sur GitHub."
    else
        echo "📤  Envoi vers GitHub : $NEW_VERSION"
        git commit -m "🔖 Deploy $NEW_VERSION"
        git push origin main
        echo ""
        echo "✅  GitHub mis à jour avec succès !"
        echo "🚀  Le build Cloud est lancé (Vercel / Render / GitHub Actions)."
    fi

# ============================================================
#   DÉPLOIEMENT NAS
# ============================================================
elif [ "$TARGET_ENV" == "nas" ]; then

    echo ""
    echo "📦  Déploiement via DockerHub (images pré-compilées par GitHub Actions)…"
    cd "$PROJECT_ROOT"

    # Inject ENV_SUFFIX into the synology compose file via sed (temp file)
    COMPOSE_SRC="$PROJECT_ROOT/docker-compose.nas.yml"
    TEMP_COMPOSE="$PROJECT_ROOT/docker-compose.deploy.yml"

    # Replace port AND inject ENV_SUFFIX literal value
    sed \
        -e "s/8080:80/${FRONTEND_PORT}:80/g" \
        -e "s/\${ENV_SUFFIX:-blue}/${ENV_SUFFIX}/g" \
        "$COMPOSE_SRC" > "$TEMP_COMPOSE"

    echo ""
    echo "🚀  Transfert vers NAS ($NAS_USER@$NAS_IP:$NAS_PATH)…"

    # Function to run ssh with sshpass if NAS_PASSWORD is set
    run_ssh() {
        if [ -n "$NAS_PASSWORD" ] && command -v sshpass >/dev/null 2>&1; then
            sshpass -p "$NAS_PASSWORD" ssh "$@"
        else
            ssh "$@"
        fi
    }

    # Create remote directory
    echo "📂  Création du répertoire distant..."
    run_ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 -p "$NAS_PORT" \
        "$NAS_USER@$NAS_IP" "mkdir -p $NAS_PATH"

    # Package & transfer
    echo "📤  Envoi de l'archive (en excluant les métadonnées macOS)..."
    env COPYFILE_DISABLE=1 tar --exclude='._*' -czf - -C "$PROJECT_ROOT" \
        "$(basename "$TEMP_COMPOSE")" \
        nginx/ backend/migrations/ .env.synology | \
        run_ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 -p "$NAS_PORT" \
            "$NAS_USER@$NAS_IP" "cat > $NAS_PATH/deploy-package.tar.gz"

    rm "$TEMP_COMPOSE"

    # Remote execution
    run_ssh -tt -o StrictHostKeyChecking=no -o ConnectTimeout=10 -p "$NAS_PORT" \
        "$NAS_USER@$NAS_IP" "NAS_PASSWORD=\"$NAS_PASSWORD\" APP_ENV_VALUE=\"$APP_ENV_VALUE\" NEW_VERSION=\"$NEW_VERSION\" ENV_SUFFIX=\"$ENV_SUFFIX\" TARGET_ENV=\"$TARGET_ENV\" NAS_PATH=\"$NAS_PATH\" DOCKERHUB_USER=\"${DOCKERHUB_USERNAME:-pokedec}\" bash -s" <<'EOF'
        set -e
        cd "$NAS_PATH"
        
        # Cleanup old files before extraction to avoid permission issues
        echo "🧹  Nettoyage des anciens fichiers..."
        if [ -n "$NAS_PASSWORD" ]; then
            echo "$NAS_PASSWORD" | sudo -S rm -rf nginx backend/migrations .env.synology docker-compose.yml 2>/dev/null || true
        else
            rm -rf nginx backend/migrations .env.synology docker-compose.yml 2>/dev/null || true
        fi
        
        tar -xzf deploy-package.tar.gz
        mkdir -p db_data
        mv docker-compose.deploy.yml docker-compose.yml

        # Write runtime .env
        cat > .env <<ENVEOF
APP_ENV=${APP_ENV_VALUE}
APP_VERSION=${NEW_VERSION}
ENV_SUFFIX=${ENV_SUFFIX}
DOCKERHUB_USERNAME=${DOCKERHUB_USER}
ENVEOF

        # Helper for sudo with password
        run_sudo() {
            if [ -n "$NAS_PASSWORD" ]; then
                echo "$NAS_PASSWORD" | sudo -S "$@"
            else
                sudo "$@"
            fi
        }

        echo "🛑  Arrêt des containers pokedec-${ENV_SUFFIX}-*…"
        run_sudo /usr/local/bin/docker-compose down --remove-orphans || true

        echo "📥   Pull des nouvelles images DockerHub…"
        run_sudo /usr/local/bin/docker-compose pull

        echo "🏗️   Démarrage des containers…"
        run_sudo /usr/local/bin/docker-compose up -d --remove-orphans

        echo "🗄️   Migration base de données (attente 10s)…"
        sleep 10
        run_sudo /usr/local/bin/docker-compose exec -T backend sh -c "PGPASSWORD=postgres psql -h db -U postgres" < backend/migrations/998_drop_redundant_tables.sql || true
        run_sudo /usr/local/bin/docker-compose exec -T backend sh -c "PGPASSWORD=postgres psql -h db -U postgres" < backend/migrations/migration_MASTER_PROD.sql || true
        run_sudo /usr/local/bin/docker-compose exec -T backend sh -c "PGPASSWORD=postgres psql -h db -U postgres" < backend/migrations/999_cleanup_legacy_users.sql || true

        echo "📸  Synchronisation des images Pokémon depuis l'image frontend…"
        run_sudo docker cp pokedec-${ENV_SUFFIX}-frontend:/usr/share/nginx/html/images/pokemon/. /volume1/docker/pokedec-shared/images/pokemon/ || true
        run_sudo /usr/local/bin/docker-compose exec -T backend chmod -R 777 /frontend/public/images || true
        run_sudo /usr/local/bin/docker-compose exec -T backend node scripts/normalize-filenames.js || true

        echo ""
        echo "🧹  Nettoyage des images Docker orphelines…"
        run_sudo /usr/local/bin/docker image prune -f || true

        echo ""
        echo "📊  Containers actifs (pokedec-${ENV_SUFFIX}-*):"
        run_sudo /usr/local/bin/docker ps --filter "name=pokedec-${ENV_SUFFIX}" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
EOF

    echo ""
    echo "✅  Déploiement ${TARGET_ENV^^} terminé !"
    echo "👉  URL : http://$NAS_IP:$FRONTEND_PORT"

# ============================================================
#   DÉPLOIEMENT LOCAL (DEV)
# ============================================================
else
    echo ""
    echo "🚀  Déploiement DEV (localhost)…"

    # Update version in docker-compose.yml
    sed -i '' "s/APP_VERSION=V.*/APP_VERSION=$NEW_VERSION # DEV version/" \
        "$PROJECT_ROOT/docker-compose.yml"

    export APP_VERSION="$NEW_VERSION"
    export APP_ENV="DEV"
    export ENV_SUFFIX="dev"

    cd "$PROJECT_ROOT"

    # Load variables from environment files
    for env_file in .env.supabase .env.local .env; do
        if [ -f "$env_file" ]; then
            echo "📖  Sourcing $env_file..."
            set -a
            source "$env_file"
            set +a
        fi
    done

    echo "🛑  Arrêt des containers locaux…"
    docker-compose -f docker-compose.local.yml down || true

    echo "🏗️   Rebuild et démarrage local (via docker-compose.local.yml)…"
    if docker-compose -f docker-compose.local.yml up -d --build; then
        echo ""
        echo "✅  Déploiement LOCAL (Cloud testing) terminé !"
        echo "👉  URL : http://localhost:8080"
        echo ""
        echo "📊  Containers actifs (pokedec-local-*):"
        docker ps --filter "name=pokedec-local" \
            --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    else
        echo "❌  Échec du déploiement DEV."
        exit 1
    fi
fi
