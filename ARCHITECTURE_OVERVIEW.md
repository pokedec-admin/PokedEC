# Architecture de Basculement Automatique - Vue d'ensemble

## 🏗️ Architecture Globale

```
┌─────────────────────────────────────────────────────────────────┐
│                         UTILISATEURS                             │
│                    (Navigateur Web)                              │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 │ HTTP Requests
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│              FRONTEND ANGULAR (Failover Logic)                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Failover Interceptor                                     │  │
│  │  - Détecte les erreurs de connexion                       │  │
│  │  - Bascule automatiquement vers Supabase                  │  │
│  │  - Rejoue les requêtes échouées                           │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
┌──────────────┐   ┌──────────────┐
│   PRIMAIRE   │   │    BACKUP    │
│     (NAS)    │   │  (Supabase)  │
│              │   │              │
│  Backend     │   │  PostgreSQL  │
│  PostgreSQL  │   │  REST API    │
│  Images      │   │  Storage     │
└──────────────┘   └──────────────┘
        │                 ▲
        │                 │
        └─────────────────┘
         Sync automatique
         (cron toutes les heures)
```

## 🔄 Flux de Basculement

### Scénario Normal (NAS Actif)

```
User → Frontend → NAS Backend → PostgreSQL (NAS)
                    ↓
                 Response
                    ↓
                  User
```

### Scénario Panne (NAS Indisponible)

```
User → Frontend → NAS Backend (TIMEOUT/ERROR)
                    ↓
              Interceptor détecte l'erreur
                    ↓
              Bascule vers Supabase
                    ↓
         Rejoue la requête → Supabase API → PostgreSQL (Cloud)
                                ↓
                            Response
                                ↓
                              User
```

### Scénario Retour (NAS Rétabli)

```
Admin clique "Revenir au serveur principal"
                    ↓
         FailoverService.switchToPrimary()
                    ↓
         localStorage.removeItem('pokedec_use_backup')
                    ↓
         Prochaines requêtes → NAS Backend
```

## 📦 Composants Clés

### Frontend

| Fichier | Rôle |
|---------|------|
| `failover.service.ts` | Gère l'état du basculement (primaire/backup) |
| `failover.interceptor.ts` | Intercepte les requêtes HTTP et gère le basculement automatique |
| `failover-status.component.ts` | Widget admin pour visualiser et contrôler l'état |
| `environment.ts` | Configuration des URLs (primaire + backup) |

### Backend/Scripts

| Fichier | Rôle |
|---------|------|
| `internalize_images.js` | Télécharge les images localement |
| `sync_to_supabase.sh` | Synchronise la DB vers Supabase |
| `setup_auto_sync.sh` | Configure la synchronisation automatique (cron) |

## 🎯 Points de Décision

### Quand basculer vers Supabase ?

```typescript
if (error.status === 0 || error.status === 502 || error.status === 504) {
  // Erreur de connexion réseau
  switchToBackup();
}
```

### Quand revenir au NAS ?

- **Automatique** : Pas encore implémenté (nécessite health check)
- **Manuel** : Via le bouton admin "Revenir au serveur principal"

## 💾 Synchronisation des Données

### Fréquence Recommandée

| Scénario | Fréquence | Commande Cron |
|----------|-----------|---------------|
| Production critique | Toutes les heures | `0 * * * *` |
| Production standard | Toutes les 6 heures | `0 */6 * * *` |
| Développement | Quotidienne | `0 2 * * *` |

### Données Synchronisées

- ✅ Tables PostgreSQL (structure + données)
- ✅ Utilisateurs et authentification
- ✅ Pokédex et collections
- ✅ Suggestions et bugs
- ❌ Images (à configurer séparément via Supabase Storage)
- ❌ Logs et métriques

## 🔐 Sécurité

### Credentials Supabase

```bash
# Dans .env.synology (NE PAS COMMITER)
SUPABASE_DB_HOST=db.xxx.supabase.co
SUPABASE_DB_PASSWORD=mot_de_passe_fort
SUPABASE_DB_USER=postgres
SUPABASE_DB_NAME=postgres
```

### Accès API

- **NAS** : Protégé par JWT (comme actuellement)
- **Supabase** : Utilise Row Level Security (RLS) + API Key

## 📊 Métriques à Surveiller

### Indicateurs de Santé

1. **Taux de basculement** : Combien de fois par jour ?
2. **Latence NAS vs Supabase** : Temps de réponse moyen
3. **Taille de la base** : Évolution du stockage
4. **Coût Supabase** : Utilisation vs limites du plan

### Dashboard Admin (à implémenter)

```typescript
interface FailoverMetrics {
  currentServer: 'NAS' | 'Supabase';
  lastSwitchTime: Date;
  totalSwitches: number;
  averageLatency: {
    nas: number;
    supabase: number;
  };
  lastSyncTime: Date;
  dbSize: {
    nas: string;
    supabase: string;
  };
}
```

## 🚀 Évolutions Futures

### Phase 2 : Synchronisation Bidirectionnelle

```
NAS ←→ Supabase (via Supabase Realtime)
```

### Phase 3 : Health Check Automatique

```typescript
setInterval(() => {
  if (isUsingBackup() && nasIsHealthy()) {
    switchToPrimary();
  }
}, 60000); // Toutes les minutes
```

### Phase 4 : CDN pour les Images

```
Images → Supabase Storage → CDN Global
```

## 💰 Estimation des Coûts

### Scénario Actuel (NAS uniquement)

- **Infrastructure** : ~300€ (achat NAS)
- **Électricité** : ~8€/mois
- **Total annuel** : ~96€

### Avec Supabase (Backup)

- **Plan Gratuit** : 0€/mois (suffisant pour backup)
- **Plan Pro** : 8€/mois (si >500 MB de données)
- **Total annuel** : 0-96€ supplémentaires

### ROI du Basculement

- **Coût de la panne** : Utilisateurs bloqués, perte de confiance
- **Coût du backup** : 0-8€/mois
- **Conclusion** : ROI positif dès la première panne évitée !

## 📚 Ressources

- [Documentation Supabase](https://supabase.com/docs)
- [PostgreSQL Replication](https://www.postgresql.org/docs/current/logical-replication.html)
- [Angular HTTP Interceptors](https://angular.io/guide/http-intercept-requests-and-responses)
