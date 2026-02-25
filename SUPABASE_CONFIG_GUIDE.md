# 🚀 Guide de Configuration Supabase - Poked'EC

Ce guide est destiné aux administrateurs débutants pour configurer correctement le service d'authentification Supabase pour le projet Poked'EC.

## ⚠️ Pourquoi cette configuration est-elle obligatoire ?
Sans ces réglages, les fonctionnalités suivantes ne fonctionneront pas :
- Inscription et confirmation d'email.
- Réinitialisation de mot de passe oublié.
- Connexion via Google ou autres réseaux sociaux.
- Sécurité des données via Row Level Security (RLS).

---

## 1. Configuration des URLs (Essentiel)
Supabase doit savoir où rediriger les utilisateurs après une action d'authentification.

1. Allez dans **Authentication** > **URL Configuration**.
2. **Site URL** : Mettez l'URL de votre frontend (ex: `https://pokedec.vercel.app` ou `http://localhost:4200` en développement).
3. **Redirect URLs** : Ajoutez impérativement l'URL suivante :
   - `https://votre-domaine.com/auth/callback`
   - `http://localhost:4200/auth/callback` (pour les tests locaux)

---

## 2. Configuration des Emails
Par défaut, Supabase envoie les emails depuis ses propres serveurs, mais avec des limites strictes.

### Templates d'emails
Personnalisez les messages envoyés aux utilisateurs dans **Authentication** > **Email Templates** :
- **Confirm Signup** : Message de bienvenue avec lien de confirmation.
- **Reset Password** : Lien pour changer de mot de passe.
- **Magic Link** : Connexion sans mot de passe.

**Note importante** : Assurez-vous que les liens dans les templates utilisent bien la variable `{{ .ConfirmationURL }}`.

---

## 3. Fournisseurs d'Authentification (Providers)
Activez les méthodes souhaitées dans **Authentication** > **Providers**.

### Email (Activé par défaut)
- Nous recommandons de laisser "Confirm email" activé pour garantir la validité des comptes.

### Google (Optionnel)
1. Créez un projet sur la [Google Cloud Console](https://console.cloud.google.com/).
2. Créez des identifiants OAuth 2.0.
3. Copiez le **Client ID** et le **Client Secret** dans Supabase.
4. Ajoutez l'URL de redirection fournie par Supabase dans la console Google.

---

## 4. Sécurité de la Base de Données (RLS)
Le projet Poked'EC utilise le **Row Level Security** pour protéger les données.

1. Allez dans l'éditeur SQL de Supabase.
2. Exécutez le script `SUPABASE_SECURITY_FIX.sql` présent à la racine du projet.
3. Cela garantira que chaque dresseur ne peut modifier que son propre Pokédex.

---

## 5. Variables d'Environnement
Assurez-vous que votre frontend et votre backend ont les bonnes clés :
- `SUPABASE_URL` : L'URL de votre projet Supabase.
- `SUPABASE_ANON_KEY` : Clé publique pour le frontend.
- `SUPABASE_SERVICE_ROLE_KEY` : Clé secrète pour le backend (à ne JAMAIS exposer côté client).

---
*Besoin d'aide ? Consultez la [documentation officielle de Supabase](https://supabase.com/docs/guides/auth).*

---

## 6. Protection contre les mots de passe compromis (Security)
Pour renforcer la sécurité de vos utilisateurs, Supabase propose une option pour empêcher l'utilisation de mots de passe connus pour avoir été fuités (via HaveIBeenPwned).

1. Allez dans **Authentication** > **Settings**.
2. Faites défiler jusqu'à la section **Security**.
3. Activez l'option **Prevent use of compromised passwords**.
4. Cliquez sur **Save**.

Cela ajoutera une couche de protection supplémentaire lors de l'inscription ou du changement de mot de passe.
