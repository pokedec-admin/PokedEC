-- ==========================================================
-- 🔐 POKED'EC - SUPABASE SECURITY & PERFORMANCE FINAL FIX
-- ==========================================================
-- Ce script corrige les vulnérabilités et problèmes de performance :
-- 1. Renomme 'users' en 'trainers' pour la cohérence.
-- 2. Déplace 'unaccent' vers le schéma 'extensions'.
-- 3. Sécurise 'normalize_form_name' avec un search_path fixe.
-- 4. Supprime les index redondants.
-- 5. Optimise les politiques RLS avec (select auth.uid()).
-- 6. Résout les conflits de politiques permissives multiples.

BEGIN;

-- 0. Renommage de la table users en trainers (si nécessaire)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        ALTER TABLE public.users RENAME TO trainers;

        -- Renommage des contraintes si elles existent avec l'ancien nom
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_pkey') THEN
            ALTER TABLE public.trainers RENAME CONSTRAINT users_pkey TO trainers_pkey;
        END IF;

        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_email_key') THEN
            ALTER TABLE public.trainers RENAME CONSTRAINT users_email_key TO trainers_email_key;
        END IF;

        -- Renommage des index
        ALTER INDEX IF EXISTS idx_users_supabase_uid RENAME TO idx_trainers_supabase_uid;
        ALTER INDEX IF EXISTS idx_users_email RENAME TO idx_trainers_email;
    END IF;
END $$;

-- 1. Création du schéma extensions et déplacement de unaccent
CREATE SCHEMA IF NOT EXISTS extensions;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'unaccent') THEN
    ALTER EXTENSION unaccent SET SCHEMA extensions;
  END IF;
END $$;

-- 2. Sécurisation de normalize_form_name
CREATE OR REPLACE FUNCTION public.normalize_form_name(name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
    RETURN regexp_replace(
        regexp_replace(
            translate(
                extensions.unaccent(name),
                ' ', '_'
            ),
            '[^a-zA-Z0-9_-]', '', 'g'
        ),
        '_+', '_', 'g'
    );
END;
$$;

-- 3. Suppression des index redondants
DROP INDEX IF EXISTS public.pokedex_user_id_pokemon_id_form_unique;
DROP INDEX IF EXISTS public.pokemon_master_unique_form;
DROP INDEX IF EXISTS public.unique_pokemon_form;

-- 4. Optimisation des Helper Functions
CREATE OR REPLACE FUNCTION public.get_my_user_id()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.trainers WHERE supabase_uid = (select auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(is_admin, false) FROM public.trainers WHERE supabase_uid = (select auth.uid());
$$;

-- 5. Activation du RLS (par précaution)
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

-- 6. Politiques pour la table 'trainers'
DROP POLICY IF EXISTS "Trainers can view own profile" ON public.trainers;
DROP POLICY IF EXISTS "Users can view own profile" ON public.trainers; -- Ancien nom possible
CREATE POLICY "Trainers can view own profile"
ON public.trainers FOR SELECT
TO authenticated
USING (supabase_uid = (select auth.uid()) OR public.is_admin());

DROP POLICY IF EXISTS "Trainers can update own profile" ON public.trainers;
DROP POLICY IF EXISTS "Users can update own profile" ON public.trainers; -- Ancien nom possible
CREATE POLICY "Trainers can update own profile"
ON public.trainers FOR UPDATE
TO authenticated
USING (supabase_uid = (select auth.uid()) OR public.is_admin())
WITH CHECK (supabase_uid = (select auth.uid()) OR public.is_admin());

-- 7. Politiques pour la table 'pokedex'
DROP POLICY IF EXISTS "Anyone can view pokedex" ON public.pokedex;
CREATE POLICY "Anyone can view pokedex"
ON public.pokedex FOR SELECT
TO authenticated, anon
USING (true);

DROP POLICY IF EXISTS "Trainers can manage own pokedex" ON public.pokedex;
-- Split pour éviter le conflit sur SELECT (Issue 3.3)
CREATE POLICY "Trainers can manage own pokedex - write"
ON public.pokedex FOR INSERT, UPDATE, DELETE
TO authenticated
USING (user_id = public.get_my_user_id() OR public.is_admin())
WITH CHECK (user_id = public.get_my_user_id() OR public.is_admin());

-- 8. Politiques pour la table 'suggestions'
DROP POLICY IF EXISTS "Trainers can manage own suggestions" ON public.suggestions;
CREATE POLICY "Trainers can manage own suggestions"
ON public.suggestions FOR ALL
TO authenticated
USING (user_id = public.get_my_user_id() OR public.is_admin())
WITH CHECK (user_id = public.get_my_user_id() OR public.is_admin());

-- 9. Politiques pour la table 'trade_requests'
DROP POLICY IF EXISTS "Trainers can view involved trade requests" ON public.trade_requests;
CREATE POLICY "Trainers can view involved trade requests"
ON public.trade_requests FOR SELECT
TO authenticated
USING (requester_id = public.get_my_user_id() OR target_user_id = public.get_my_user_id() OR public.is_admin());

DROP POLICY IF EXISTS "Trainers can create trade requests" ON public.trade_requests;
CREATE POLICY "Trainers can create trade requests"
ON public.trade_requests FOR INSERT
TO authenticated
WITH CHECK (requester_id = public.get_my_user_id() OR public.is_admin());

-- 10. Politiques pour les tables de référence (Master Data)
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
            -- Utilisation de INSERT, UPDATE, DELETE uniquement pour éviter le double SELECT (Performance issue)
            EXECUTE format('CREATE POLICY "Admins can manage master data" ON public.%I FOR INSERT, UPDATE, DELETE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())', t);
        END IF;
    END LOOP;
END $$;

-- 11. Droits du schéma public
REVOKE ALL ON SCHEMA public FROM public;
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT USAGE ON SCHEMA extensions TO anon, authenticated;

-- On donne les droits d'écriture à authenticated (le RLS filtrera)
GRANT INSERT, UPDATE, DELETE ON TABLE public.pokedex TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.suggestions TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.trade_requests TO authenticated;
GRANT UPDATE ON TABLE public.trainers TO authenticated;

-- Protection des colonnes sensibles
REVOKE SELECT (password) ON public.trainers FROM anon, authenticated;

COMMIT;

SELECT '✅ Script de sécurité et performance appliqué avec succès.' as status;
