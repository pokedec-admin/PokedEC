BEGIN;

-- Add normalization logic (Normalization des noms de fichiers)
CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE OR REPLACE FUNCTION normalize_form_name(name TEXT) RETURNS TEXT AS $$
BEGIN
    RETURN regexp_replace(
        regexp_replace(
            translate(
                unaccent(name),
                ' ', '_'
            ),
            '[^a-zA-Z0-9_-]', '', 'g'
        ),
        '_+', '_', 'g'
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- MEGA MIGRATION FOR PROD (BLUE/GREEN)
-- Date: 2025-12-23
-- Focus: Full Form Support Architecture
