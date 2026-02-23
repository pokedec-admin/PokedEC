-- ==========================================================
-- 🔐 POKED'EC - SUPABASE SECURITY ADVISOR FIX SCRIPT
-- ==========================================================
-- Ce script corrige les vulnérabilités courantes signalées par le
-- Supabase Security Advisor :
-- 1. Active le Row Level Security (RLS) sur toutes les tables.
-- 2. Définit des politiques d'accès (Policies) granulaires.
-- 3. Sécurise le schéma public.
-- 4. Masque les données sensibles.

BEGIN;

-- 1. Helper Function pour récupérer l'ID utilisateur interne
-- Utilisée pour lier auth.uid() (UUID de Supabase) à users.id (integer)
CREATE OR REPLACE FUNCTION public.get_my_user_id()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.users WHERE supabase_uid = auth.uid();
$$;

-- Helper Function pour vérifier si l'utilisateur est admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(is_admin, false) FROM public.users WHERE supabase_uid = auth.uid();
$$;

-- 2. Activation du RLS sur toutes les tables
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    END LOOP;
END $$;

-- 3. Politiques pour la table 'users'
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile"
ON public.users FOR SELECT
TO authenticated
USING (supabase_uid = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
ON public.users FOR UPDATE
TO authenticated
USING (supabase_uid = auth.uid() OR public.is_admin())
WITH CHECK (supabase_uid = auth.uid() OR public.is_admin());

-- 4. Politiques pour la table 'pokedex'
DROP POLICY IF EXISTS "Anyone can view pokedex" ON public.pokedex;
CREATE POLICY "Anyone can view pokedex"
ON public.pokedex FOR SELECT
TO authenticated, anon
USING (true);

DROP POLICY IF EXISTS "Users can manage own pokedex" ON public.pokedex;
CREATE POLICY "Users can manage own pokedex"
ON public.pokedex FOR ALL
TO authenticated
USING (user_id = public.get_my_user_id() OR public.is_admin())
WITH CHECK (user_id = public.get_my_user_id() OR public.is_admin());

-- 5. Politiques pour la table 'suggestions'
DROP POLICY IF EXISTS "Users can manage own suggestions" ON public.suggestions;
CREATE POLICY "Users can manage own suggestions"
ON public.suggestions FOR ALL
TO authenticated
USING (user_id = public.get_my_user_id() OR public.is_admin())
WITH CHECK (user_id = public.get_my_user_id() OR public.is_admin());

-- 6. Politiques pour la table 'trade_requests'
DROP POLICY IF EXISTS "Users can view involved trade requests" ON public.trade_requests;
CREATE POLICY "Users can view involved trade requests"
ON public.trade_requests FOR SELECT
TO authenticated
USING (requester_id = public.get_my_user_id() OR target_user_id = public.get_my_user_id() OR public.is_admin());

DROP POLICY IF EXISTS "Users can create trade requests" ON public.trade_requests;
CREATE POLICY "Users can create trade requests"
ON public.trade_requests FOR INSERT
TO authenticated
WITH CHECK (requester_id = public.get_my_user_id() OR public.is_admin());

DROP POLICY IF EXISTS "Users can update involved trade requests" ON public.trade_requests;
CREATE POLICY "Users can update involved trade requests"
ON public.trade_requests FOR UPDATE
TO authenticated
USING (requester_id = public.get_my_user_id() OR target_user_id = public.get_my_user_id() OR public.is_admin());

-- 7. Politiques pour les tables de référence (Master Data)
-- On applique une politique de lecture seule pour tout le monde
DO $$
DECLARE
    t text;
    master_tables text[] := ARRAY['pokemon_master', 'classifications', 'regions', 'types', 'pokemon_category_availability', 'pokemon_names'];
BEGIN
    FOREACH t IN ARRAY master_tables
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = t AND table_schema = 'public') THEN
            EXECUTE format('DROP POLICY IF EXISTS "Read-only for everyone" ON public.%I', t);
            EXECUTE format('CREATE POLICY "Read-only for everyone" ON public.%I FOR SELECT TO authenticated, anon USING (true)', t);

            EXECUTE format('DROP POLICY IF EXISTS "Admins can manage master data" ON public.%I', t);
            EXECUTE format('CREATE POLICY "Admins can manage master data" ON public.%I FOR ALL TO authenticated USING (public.is_admin())', t);
        END IF;
    END LOOP;
END $$;

-- 8. Sécurité du schéma public
REVOKE ALL ON SCHEMA public FROM public;
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- On donne les droits de SELECT à tout le monde
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;

-- On donne les droits d'écriture à authenticated (le RLS filtrera)
GRANT INSERT, UPDATE, DELETE ON TABLE public.pokedex TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.suggestions TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.trade_requests TO authenticated;
GRANT UPDATE ON TABLE public.users TO authenticated;

-- 9. Protection des colonnes sensibles
-- On révoque l'accès à la colonne password pour les rôles anon et authenticated
-- (Le backend continuera d'y avoir accès via le rôle postgres/service_role)
REVOKE SELECT (password) ON public.users FROM anon, authenticated;

-- 10. Email Verification Codes (System only)
-- On n'autorise aucun accès via PostgREST (anon/authenticated)
-- Le RLS est déjà activé (étape 2) et aucune politique d'accès n'est créée,
-- ce qui signifie "accès refusé" par défaut.

COMMIT;

SELECT '✅ Script de sécurité appliqué avec succès dans la transaction.' as status;
