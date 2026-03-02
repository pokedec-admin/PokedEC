-- Cleanup: Drop redundant tables
-- pokemon_names is merged into pokemon_master
-- email_verification_codes is obsolete (Supabase Auth used instead)

BEGIN;

DROP TABLE IF EXISTS pokemon_names;
DROP TABLE IF EXISTS email_verification_codes;

COMMIT;
