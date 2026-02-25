-- ==========================================================
-- 🛠️ POKED'EC - EMERGENCY DATABASE REPAIR & SYNC
-- ==========================================================

BEGIN;

-- 1. Récupération des données de la nouvelle table 'trainers' vers 'users'
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users')
       AND EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'trainers') THEN

        -- On met à jour users avec les supabase_uid de trainers si ils manquent
        UPDATE public.users u
        SET supabase_uid = t.supabase_uid
        FROM public.trainers t
        WHERE u.email = t.email AND (u.supabase_uid IS NULL OR u.supabase_uid = '') AND t.supabase_uid IS NOT NULL;

        -- On synchronise is_admin et autres colonnes potentiellement perdues
        UPDATE public.users u
        SET is_admin = COALESCE(u.is_admin, false) OR COALESCE(t.is_admin, false),
            team = COALESCE(u.team, t.team),
            trainer_name = COALESCE(u.trainer_name, t.trainer_name)
        FROM public.trainers t
        WHERE u.email = t.email;

        -- On insère les nouveaux dresseurs créés dans la mauvaise table
        INSERT INTO public.users (email, trainer_name, team, supabase_uid, is_admin, created_at)
        SELECT email, trainer_name, team, supabase_uid, is_admin, created_at
        FROM public.trainers
        WHERE email NOT IN (SELECT email FROM public.users);

        -- AVANT de supprimer trainers, on essaie de rattacher les entrées pokedex
        -- qui auraient été créées avec les mauvais IDs
        UPDATE public.pokedex p
        SET user_id = u.id
        FROM public.trainers t
        JOIN public.users u ON t.email = u.email
        WHERE p.user_id = t.id AND t.id <> u.id;

        -- Pareil pour suggestions
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'suggestions') THEN
            UPDATE public.suggestions s
            SET user_id = u.id
            FROM public.trainers t
            JOIN public.users u ON t.email = u.email
            WHERE s.user_id = t.id AND t.id <> u.id;
        END IF;

        -- On peut maintenant supprimer la table 'trainers' erronée
        DROP TABLE public.trainers CASCADE;
    END IF;
END $$;

-- 2. Renommage propre de 'users' en 'trainers'
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        ALTER TABLE public.users RENAME TO trainers;

        -- Renommage des séquences et contraintes
        -- On ignore les erreurs si déjà renommé
        BEGIN
            ALTER TABLE public.trainers RENAME CONSTRAINT users_pkey TO trainers_pkey;
        EXCEPTION WHEN OTHERS THEN NULL;
        END;

        BEGIN
            ALTER TABLE public.trainers RENAME CONSTRAINT users_email_key TO trainers_email_key;
        EXCEPTION WHEN OTHERS THEN NULL;
        END;

        -- Renommage des index
        ALTER INDEX IF EXISTS idx_users_supabase_uid RENAME TO idx_trainers_supabase_uid;
        ALTER INDEX IF EXISTS idx_users_email RENAME TO idx_trainers_email;
    END IF;
END $$;

-- 3. Nettoyage de la table Pokedex (Dédoublonnage)
-- On supprime les doublons avant de créer l'index unique
DELETE FROM public.pokedex p1
WHERE p1.id < ANY (
    SELECT p2.id FROM public.pokedex p2
    WHERE p1.user_id = p2.user_id
      AND p1.pokemon_id = p2.pokemon_id
      AND COALESCE(p1.form, '') = COALESCE(p2.form, '')
      AND p1.id <> p2.id
);

-- 4. Application des correctifs de sécurité et performance
CREATE SCHEMA IF NOT EXISTS extensions;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'unaccent') THEN
    ALTER EXTENSION unaccent SET SCHEMA extensions;
  END IF;
END $$;

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

DROP INDEX IF EXISTS public.pokedex_user_id_pokemon_id_form_unique;
DROP INDEX IF EXISTS public.pokemon_master_unique_form;
DROP INDEX IF EXISTS public.unique_pokemon_form;

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

-- Politiques Trainers
DROP POLICY IF EXISTS "Trainers can view own profile" ON public.trainers;
DROP POLICY IF EXISTS "Users can view own profile" ON public.trainers;
CREATE POLICY "Trainers can view own profile"
ON public.trainers FOR SELECT
TO authenticated
USING (supabase_uid = (select auth.uid()) OR public.is_admin());

DROP POLICY IF EXISTS "Trainers can update own profile" ON public.trainers;
DROP POLICY IF EXISTS "Users can update own profile" ON public.trainers;
CREATE POLICY "Trainers can update own profile"
ON public.trainers FOR UPDATE
TO authenticated
USING (supabase_uid = (select auth.uid()) OR public.is_admin())
WITH CHECK (supabase_uid = (select auth.uid()) OR public.is_admin());

-- Politiques Pokedex
DROP POLICY IF EXISTS "Anyone can view pokedex" ON public.pokedex;
CREATE POLICY "Anyone can view pokedex"
ON public.pokedex FOR SELECT
TO authenticated, anon
USING (true);

DROP POLICY IF EXISTS "Trainers can manage own pokedex" ON public.pokedex;
DROP POLICY IF EXISTS "Trainers can manage own pokedex - write" ON public.pokedex;
CREATE POLICY "Trainers can manage own pokedex - write"
ON public.pokedex FOR INSERT, UPDATE, DELETE
TO authenticated
USING (user_id = public.get_my_user_id() OR public.is_admin())
WITH CHECK (user_id = public.get_my_user_id() OR public.is_admin());

-- Master Data
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
            EXECUTE format('CREATE POLICY "Admins can manage master data" ON public.%I FOR INSERT, UPDATE, DELETE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())', t);
        END IF;
    END LOOP;
END $$;

REVOKE ALL ON SCHEMA public FROM public;
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT USAGE ON SCHEMA extensions TO anon, authenticated;

GRANT INSERT, UPDATE, DELETE ON TABLE public.pokedex TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.suggestions TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.trade_requests TO authenticated;
GRANT UPDATE ON TABLE public.trainers TO authenticated;

-- Protection des colonnes sensibles
REVOKE SELECT (password) ON public.trainers FROM anon, authenticated;

COMMIT;

SELECT '✅ Emergency Fix Applied Successfully' as status;
