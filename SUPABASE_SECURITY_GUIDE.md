# 🛡️ Guide de Sécurisation Supabase - Poked'EC

Ce dossier contient un script SQL permettant de corriger les alertes du **Security Advisor** de Supabase et de renforcer la sécurité de votre base de données.

## 🚀 Comment appliquer les correctifs ?

1. Connectez-vous à votre [Tableau de bord Supabase](https://supabase.com/dashboard).
2. Sélectionnez votre projet.
3. Allez dans l'onglet **SQL Editor** (dans la barre latérale gauche).
4. Cliquez sur **New Query**.
5. Copiez le contenu du fichier `SUPABASE_SECURITY_FIX.sql` et collez-le dans l'éditeur.
6. Cliquez sur **Run**.

## 🛡️ Ce que fait ce script

### 1. Row Level Security (RLS)
Il active le RLS sur toutes les tables du schéma `public`. Sans RLS, n'importe qui possédant votre clé `anon` pourrait lire ou modifier vos données via l'API REST de Supabase.

### 2. Politiques d'accès (Policies)
Le script crée des règles strictes :
- **Utilisateurs** : Peuvent voir et modifier uniquement leur propre profil.
- **Pokédex** : Tout le monde peut voir les collections (lecture), mais seul le propriétaire peut ajouter/modifier ses Pokémon.
- **Suggestions** : Chaque utilisateur ne voit que ses propres retours.
- **Trade Requests** : Seuls les participants d'un échange peuvent voir la requête associée.
- **Données Master** : Les tables de référence (liste des Pokémon, types, etc.) sont en lecture seule pour tous.

### 3. Protection des données sensibles
- La colonne `password` de la table `users` est **masquée**. Elle ne pourra plus être récupérée via l'API REST (PostgREST), même par l'utilisateur lui-même. Le backend reste capable de l'utiliser pour la vérification des mots de passe.

### 4. Droits du schéma
- Restreint les permissions sur le schéma `public` pour empêcher toute modification accidentelle de la structure de la base par des utilisateurs non privilégiés.

## ⚠️ Notes importantes

- **Admins** : Le script inclut une fonction `is_admin()` qui donne aux administrateurs (ceux ayant `is_admin = true` dans la table `users`) un accès complet pour gérer les données.
- **Backend** : Votre serveur Node.js continue de fonctionner normalement car il utilise généralement une connexion directe (via `DATABASE_URL`) qui outrepasse les politiques RLS.

---
*Dernière mise à jour : Février 2025*
