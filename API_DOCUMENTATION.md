# 📚 Documentation API Backend Pokedec

Cette documentation décrit l'ensemble des points de terminaison (endpoints) disponibles sur le backend de l'application Pokedec.

## 🔐 Authentification (`/api/auth`)

Ces routes gèrent l'inscription, la connexion et la gestion du profil utilisateur.

| Méthode | Endpoint | Description | Auth Requise |
| :--- | :--- | :--- | :--- |
| `POST` | `/signup` | Créer un nouveau compte utilisateur. | Non |
| `POST` | `/login` | Se connecter avec email et mot de passe. | Non |
| `POST` | `/google` | Se connecter avec un token Google. | Non |
| `POST` | `/forgot-password` | Demander une réinitialisation de mot de passe. | Non |
| `GET` | `/profile` | Récupérer les informations du profil connecté. | Oui |
| `PUT` | `/profile` | Mettre à jour les informations du profil. | Oui |
| `DELETE` | `/profile` | Supprimer son compte utilisateur. | Oui |
| `POST` | `/change-password` | Changer son mot de passe. | Oui |

---

## 👑 Administration (`/api/admin`)

Ces routes sont réservées aux utilisateurs ayant le rôle **Admin**.

| Méthode | Endpoint | Description | Auth Requise |
| :--- | :--- | :--- | :--- |
| `GET` | `/users` | Lister tous les utilisateurs inscrits. | Admin |
| `PUT` | `/users/:id` | Modifier les informations d'un utilisateur spécifique. | Admin |
| `DELETE` | `/users/:id` | Supprimer un utilisateur. | Admin |
| `PUT` | `/users/:id/admin` | Promouvoir ou rétrograder un utilisateur (Admin/User). | Admin |

---

## 📖 Pokédex (`/api/pokedex`)

Ces routes permettent la gestion de la collection de Pokémon de l'utilisateur.

| Méthode | Endpoint | Description | Auth Requise |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Récupérer le Pokédex complet de l'utilisateur. | Oui |
| `GET` | `/stats` | Obtenir les statistiques (total, shiny, lucky, etc.). | Oui |
| `POST` | `/` | Ajouter un Pokémon au Pokédex. | Oui |
| `DELETE` | `/:pokemon_id` | Retirer un Pokémon du Pokédex. | Oui |
| `GET` | `/:pokemon_id` | Obtenir les détails d'un Pokémon spécifique. | Oui |
| `GET` | `/search/:query` | Rechercher un Pokémon par nom (multilingue). | Oui |
| `POST` | `/bulk-fill` | Remplissage automatique (Bulk Fill) par catégorie. | Oui |

### 🔄 Actions Rapides (Toggles)

| Méthode | Endpoint | Description |
| :--- | :--- | :--- |
| `PATCH` | `/:pokemon_id/shiny` | Basculer l'état Shiny ✨ |
| `PATCH` | `/:pokemon_id/lucky` | Basculer l'état Chanceux 🍀 |
| `PATCH` | `/:pokemon_id/xxl` | Basculer l'état XXL 📏 |
| `PATCH` | `/:pokemon_id/xxs` | Basculer l'état XXS 🤏 |
| `PATCH` | `/:pokemon_id/trade` | Basculer l'état Échangeable 🤝 |
| `PATCH` | `/:pokemon_id/toggle/:field` | Basculer n'importe quel champ booléen (gmax, mega, obscure, etc.). |

### 🌍 Communauté & Échanges

| Méthode | Endpoint | Description | Auth Requise |
| :--- | :--- | :--- | :--- |
| `GET` | `/trade-available` | Voir les Pokémon proposés à l'échange par les autres. | Oui |
| `GET` | `/recent-others` | Voir les derniers ajouts des autres utilisateurs. | Oui |
| `GET` | `/my-recent` | Voir ma dernière activité. | Oui |

---

## ⚙️ Gestion des Catégories de Pokémon (`/api/admin/pokemon-categories`)

Permet de définir quels Pokémon peuvent être Shiny, Lucky, etc. (Réservé Admin).

| Méthode | Endpoint | Description | Auth Requise |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Lister tous les Pokémon avec leurs disponibilités. | Admin |
| `GET` | `/:pokemon_id` | Obtenir la disponibilité pour un Pokémon. | Admin |
| `PUT` | `/:pokemon_id` | Mettre à jour la disponibilité pour un Pokémon. | Admin |
| `POST` | `/batch` | Mise à jour par lot (plusieurs Pokémon). | Admin |

---

## 💡 Suggestions & Bugs (`/api/suggestions`)

Système de feedback utilisateur.

| Méthode | Endpoint | Description | Auth Requise |
| :--- | :--- | :--- | :--- |
| `POST` | `/` | Soumettre une nouvelle suggestion ou un bug. | Oui |
| `GET` | `/` | Voir mes suggestions soumises. | Oui |
| `PATCH` | `/:id/read` | Marquer une réponse admin comme lue. | Oui |
| `GET` | `/admin` | Voir toutes les suggestions (Admin). | Admin |
| `PATCH` | `/admin/:id` | Répondre à une suggestion ou changer son statut. | Admin |
