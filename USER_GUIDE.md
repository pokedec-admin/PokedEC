# Guide Utilisateur - ng-PokedEC

Bienvenue sur **ng-PokedEC**, votre application de gestion de collection Pokémon GO !

---

## 🚀 Démarrage

### 1. Création de Compte
1. Cliquez sur **"S'inscrire"** depuis la page d'accueil.
2. Remplissez le formulaire (Email, Mot de passe, Nom de dresseur, Équipe).
3. **Vérification Email** : Un code à 4 chiffres vous sera envoyé par email. Entrez-le pour activer votre compte.
   - *Note : Le code expire après 10 minutes.*

### 2. Connexion
- Utilisez votre email et mot de passe.
- Si vous êtes administrateur, vous aurez accès au tableau de bord Admin.

---

## 📱 Fonctionnalités Principales

### 1. Mon Pokédex
Gérez votre collection personnelle.

- **Ajouter un Pokémon** :
  - Utilisez la barre de recherche (Nom ou ID).
  - Cliquez sur "Ajouter au Pokédex".
- **Gérer les Variantes** :
  - Cochez les cases pour marquer vos variantes : Shiny ✨, Chanceux 🍀, XXL/XXS, Obscur/Purifié, etc.
  - *Note : Certaines variantes (ex: Légendaire) dépendent de la configuration globale définie par les admins.*
- **Filtres** :
  - Filtrez par **Région** (Kanto, Johto...), **Type** (Feu, Eau...) ou **Classification**.
- **Mode Échange** :
  - Cliquez sur l'icône 💱 pour marquer un Pokémon comme "Disponible à l'échange".

### 2. Échanges (Trade)
Visualisez les Pokémon que les autres utilisateurs proposent à l'échange.

- Allez dans l'onglet **"Échanges"**.
- Vous verrez la liste des Pokémon disponibles avec le nom du dresseur et les variantes proposées (Shiny, XXL, etc.).

### 3. Statistiques
Consultez votre progression globale.

- Nombre total de Pokémon capturés.
- Détail par catégorie (Combien de Shiny ? De 100% ?).

---

## 🛡️ Espace Administrateur
*Accessible uniquement aux utilisateurs avec le rôle Admin.*

### 1. Gestion des Utilisateurs
- **Liste des utilisateurs** : Voir tous les inscrits.
- **Activer/Désactiver** : Bloquez l'accès à un utilisateur si nécessaire.
- **Voir les détails** : Email, Nom de dresseur, Équipe.

### 2. Gestion des Catégories Pokémon
Définissez les règles globales pour chaque Pokémon.

- **Disponibilité** : Rendez un Pokémon visible ou invisible dans le Pokédex global.
- **Catégorie Exclusive** : Définissez si un Pokémon est considéré comme **Normal**, **Légendaire**, **Fabuleux** ou **Ultra-Chimère**.
  - *Cela affecte l'affichage et les filtres pour tous les utilisateurs.*
- **Variantes Autorisées** : Cochez ce qui est possible pour ce Pokémon (ex: peut-il être Shiny ? A-t-il une forme G-MAX ?).

### 3. Import de Données
- Mettez à jour les noms des Pokémon (multilingue) via l'outil d'import.

---

## ❓ FAQ

**Q: Je ne reçois pas le code de vérification.**
R: Vérifiez vos spams. L'email provient de `pokedec.noreply@gmail.com`.

**Q: Pourquoi je ne peux pas cocher "Légendaire" pour Rattata ?**
R: Les catégories sont définies par les administrateurs. Rattata est classé comme "Normal", donc la case Légendaire est désactivée.

**Q: Comment changer mon mot de passe ?**
R: Allez sur votre page **Profil** (cliquez sur votre nom en haut à droite).
