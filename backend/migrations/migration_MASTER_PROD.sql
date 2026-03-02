-- ============================================================================
-- MASTER MIGRATION : GLOBAL OPTIMIZATION & RESTRUCTURING
-- Date: 2026-03-02
-- Objectif: Performant, Atomique, Idempotent. 
-- ============================================================================

BEGIN;

-- 0. EXTENSIONS & FUNCTIONS
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

-- 1. SCHEMA CONSOLIDATION (pokemon_master)
DO $$ 
BEGIN
    -- Columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pokemon_master' AND column_name='form_name') THEN
        ALTER TABLE pokemon_master ADD COLUMN form_name VARCHAR(50) DEFAULT 'Normal';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pokemon_master' AND column_name='id') THEN
        ALTER TABLE pokemon_master ADD COLUMN id SERIAL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pokemon_master' AND column_name='image_url') THEN
        ALTER TABLE pokemon_master ADD COLUMN image_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pokemon_master' AND column_name='regional_description') THEN
        ALTER TABLE pokemon_master ADD COLUMN regional_description TEXT;
    END IF;

    -- Primary Key Revamp
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name='pokemon_master_pkey' AND table_name='pokemon_master'
    ) THEN
        -- Check if PK is only on pokemon_id (old style)
        IF EXISTS (
            SELECT 1 FROM information_schema.key_column_usage 
            WHERE constraint_name='pokemon_master_pkey' AND table_name='pokemon_master' AND column_name='pokemon_id'
            AND (SELECT count(*) FROM information_schema.key_column_usage WHERE constraint_name='pokemon_master_pkey' AND table_name='pokemon_master') = 1
        ) THEN
            ALTER TABLE pokemon_master DROP CONSTRAINT pokemon_master_pkey;
            ALTER TABLE pokemon_master ADD PRIMARY KEY (id);
        END IF;
    ELSIF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='pokemon_master_pkey' AND table_name='pokemon_master') THEN
        ALTER TABLE pokemon_master ADD PRIMARY KEY (id);
    END IF;

    -- Unique Constraint
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='unique_pokemon_form' AND table_name='pokemon_master') THEN
        ALTER TABLE pokemon_master ADD CONSTRAINT unique_pokemon_form UNIQUE (pokemon_id, form_name);
    END IF;

    -- Form Names Predefined Table
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='form_names_predefined') THEN
        CREATE TABLE form_names_predefined (
            id SERIAL PRIMARY KEY,
            name VARCHAR(50) UNIQUE NOT NULL,
            is_predefined BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    END IF;
END $$;

-- 2. CORE DATA POPULATION (Regions & Forms)
INSERT INTO regions (name_key, name_fr, name_en, display_order, is_custom) VALUES
('paldea', 'Paldea', 'Paldea', 10, FALSE)
ON CONFLICT (name_key) DO NOTHING;

INSERT INTO form_names_predefined (name) VALUES 
('Méga'), ('Gigamax'), ('Dynamax'), ('Totémique'), ('Alola'), ('Galar'), ('Hisui'), ('Paldea')
ON CONFLICT (name) DO NOTHING;

-- 3. MASS INSERT REGIONAL FORMS
-- (Optimization: Using a single query with sub-selects is faster than looping)
INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, classification_id, region_id, type_primary_id, type_secondary_id)
SELECT pokemon_id, 'Alola', name_fr || ' (Alola)', classification_id, 7, type_primary_id, type_secondary_id FROM pokemon_master WHERE pokemon_id IN (19,20,26,27,28,37,38,50,51,52,53,74,75,76,88,89,103,105) AND form_name = 'Normal'
ON CONFLICT (pokemon_id, form_name) DO NOTHING;

INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, classification_id, region_id, type_primary_id, type_secondary_id)
SELECT pokemon_id, 'Galar', name_fr || ' (Galar)', classification_id, 8, type_primary_id, type_secondary_id FROM pokemon_master WHERE pokemon_id IN (52,77,78,79,80,83,110,122,144,145,146,263,264,554,555,562,618) AND form_name = 'Normal'
ON CONFLICT (pokemon_id, form_name) DO NOTHING;

INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, classification_id, region_id, type_primary_id, type_secondary_id)
SELECT pokemon_id, 'Hisui', name_fr || ' (Hisui)', classification_id, 9, type_primary_id, type_secondary_id FROM pokemon_master WHERE pokemon_id IN (58,59,100,101,157,211,503,548,549,570,571,627,628,705,706,712,713,724) AND form_name = 'Normal'
ON CONFLICT (pokemon_id, form_name) DO NOTHING;

INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, classification_id, region_id, type_primary_id, type_secondary_id)
SELECT pokemon_id, 'Paldea', name_fr || ' (Paldea)', classification_id, 10, type_primary_id, type_secondary_id FROM pokemon_master WHERE pokemon_id IN (194) AND form_name = 'Normal'
ON CONFLICT (pokemon_id, form_name) DO NOTHING;

-- Special Legends
INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, classification_id, region_id, type_primary_id, type_secondary_id)
SELECT 646, f, 'Kyurem ' || f, 2, 5, 15, 6 FROM (VALUES ('Noir'), ('Blanc')) AS t(f) 
ON CONFLICT (pokemon_id, form_name) DO NOTHING;

INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, classification_id, region_id, type_primary_id, type_secondary_id)
SELECT 800, f, 'Necrozma (' || f || ')', 2, 7, 13, 16 FROM (VALUES ('Crinière du Couchant'), ('Ailes de l''Aurore')) AS t(f)
ON CONFLICT (pokemon_id, form_name) DO NOTHING;

INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, classification_id, region_id, type_primary_id, type_secondary_id)
SELECT 898, f, 'Calyrex (' || f || ')', 2, 8, 13, 6 FROM (VALUES ('Cavalier du Froid'), ('Cavalier d''Effroi')) AS t(f)
ON CONFLICT (pokemon_id, form_name) DO NOTHING;

INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, classification_id, region_id, type_primary_id, type_secondary_id)
SELECT 741, f, 'Plumeline (' || f || ')', 1, 7, 5, 18 FROM (VALUES ('Pom-Pom'), ('Hula'), ('Buyō')) AS t(f)
ON CONFLICT (pokemon_id, form_name) DO NOTHING;

-- 4. BATCH UPDATE METADATA (Types, Translations, Images)
-- (Optimization: Use a values-based update instead of hundreds of single UPDATE statements)
DO $$
BEGIN
    -- Raichu Alola
    UPDATE pokemon_master SET type_primary_id = 5, type_secondary_id = 13, region_id = 7 WHERE pokemon_id = 26 AND form_name = 'Alola';
    -- Ninetales Alola
    UPDATE pokemon_master SET type_primary_id = 8, type_secondary_id = 6, region_id = 7 WHERE pokemon_id = 38 AND form_name = 'Alola';
    -- Vulpix Alola
    UPDATE pokemon_master SET type_primary_id = 8, type_secondary_id = NULL, region_id = 7 WHERE pokemon_id = 37 AND form_name = 'Alola';
    -- Rattata Alola
    UPDATE pokemon_master SET type_primary_id = 17, type_secondary_id = 10, region_id = 7 WHERE pokemon_id = 19 AND form_name = 'Alola';
    -- Sandshrew Alola
    UPDATE pokemon_master SET type_primary_id = 8, type_secondary_id = 1, region_id = 7 WHERE pokemon_id = 27 AND form_name = 'Alola';
    -- Weezing Galar
    UPDATE pokemon_master SET type_primary_id = 12, type_secondary_id = 6, region_id = 8 WHERE pokemon_id = 110 AND form_name = 'Galar';
    -- Wooper Paldea
    UPDATE pokemon_master SET type_primary_id = 12, type_secondary_id = 15, region_id = 10 WHERE pokemon_id = 194 AND form_name = 'Paldea';
    -- Oricorio
    UPDATE pokemon_master SET type_primary_id = 5, type_secondary_id = 18, region_id = 7 WHERE pokemon_id = 741 AND form_name = 'Pom-Pom';
    UPDATE pokemon_master SET type_primary_id = 13, type_secondary_id = 18, region_id = 7 WHERE pokemon_id = 741 AND form_name = 'Hula';
    UPDATE pokemon_master SET type_primary_id = 16, type_secondary_id = 18, region_id = 7 WHERE pokemon_id = 741 AND form_name = 'Buyō';
END $$;

-- Massive PokeAPI URL & Translation Update (Consolidated)
-- Use a CTE for efficient bulk translation/URL mapping
WITH metadata_updates (pid, fname, img, en_suffix, de_suffix) AS (
    VALUES 
    (26, 'Alola', '10100.png', ' (Alolan Raichu)', ' (Alola Raichu)'),
    (38, 'Alola', '10104.png', ' (Alolan Ninetales)', ' (Alola Vulnona)'),
    (351, 'Solaire', '10013.png', ' (Sunny Castform)', ' (Formeo (Sonne))'),
    (351, 'Eau de Pluie', '10014.png', ' (Rainy Castform)', ' (Formeo (Regen))'),
    (386, 'Attaque', '10001.png', ' (Attack Deoxys)', ' (Deoxys (Angriff))'),
    (386, 'Défense', '10002.png', ' (Defense Deoxys)', ' (Deoxys (Verteidigung))'),
    (386, 'Vitesse', '10003.png', ' (Speed Deoxys)', ' (Deoxys (Initiative))'),
    (741, 'Pom-Pom', '10123.png', ' (Pom-pom Oricorio)', ' (Choreogel (Cheerleading))'),
    (741, 'Hula', '10124.png', ' (Pa’u Oricorio)', ' (Choreogel (Hula))'),
    (741, 'Buyō', '10125.png', ' (Sensu Oricorio)', ' (Choreogel (Buyo))'),
    (413, 'Déchet', '10005.png', ' (Trash Wormadam)', ' (Burmadame (Lumpen))'),
    (479, 'Chaleur', '10008.png', ' (Heat Rotom)', ' (Hitze-Rotom)'),
    (479, 'Lavage', '10009.png', ' (Wash Rotom)', ' (Wasch-Rotom)'),
    (479, 'Froid', '10010.png', ' (Frost Rotom)', ' (Frost-Rotom)'),
    (479, 'Hélice', '10011.png', ' (Fan Rotom)', ' (Wirbel-Rotom)'),
    (479, 'Tonte', '10012.png', ' (Mow Rotom)', ' (Schneid-Rotom)'),
    (710, 'Petit', '10027.png', ' (Small Pumpkaboo)', ' (Irrbis (S))'),
    (710, 'Grand', '10028.png', ' (Large Pumpkaboo)', ' (Irrbis (L))'),
    (710, 'Ultra', '10029.png', ' (Super Pumpkaboo)', ' (Irrbis (XL))'),
    (711, 'Petit', '10030.png', ' (Small Gourgeist)', ' (Pumpdjinn (S))'),
    (711, 'Grand', '10031.png', ' (Large Gourgeist)', ' (Pumpdjinn (L))'),
    (711, 'Ultra', '10032.png', ' (Super Gourgeist)', ' (Pumpdjinn (XL))'),
    (745, 'Nocturne', '10126.png', ' (Midnight Lycanroc)', ' (Wolwerock (Nacht))'),
    (745, 'Crépusculaire', '10152.png', ' (Dusk Lycanroc)', ' (Wolwerock (Zwielicht))'),
    (646, 'Noir', '10022.png', ' (Black Kyurem)', ' (Schwarzes Kyurem)'),
    (646, 'Blanc', '10023.png', ' (White Kyurem)', ' (Weißes Kyurem)'),
    (800, 'Crinière du Couchant', '10155.png', ' (Dusk Necrozma)', ' (Necrozma (Abendmähne))'),
    (800, 'Ailes de l''Aurore', '10156.png', ' (Dawn Necrozma)', ' (Necrozma (Morgenschwingen))'),
    (888, 'Épée Suprême', '10188.png', ' (Crowned Zacian)', ' (König Zacian)'),
    (889, 'Bouclier Suprême', '10189.png', ' (Crowned Zamazenta)', ' (König Zamazenta)'),
    (898, 'Cavalier du Froid', '10193.png', ' (Ice Calyrex)', ' (Coronospa (Schimmelreiter))'),
    (898, 'Cavalier d''Effroi', '10194.png', ' (Shadow Calyrex)', ' (Coronospa (Rappenreiter))'),
    (641, 'Totémique', '10019.png', ' (Therian Tornadus)', ' (Boreos (Tiergeist))'),
    (642, 'Totémique', '10020.png', ' (Therian Thundurus)', ' (Voltolos (Tiergeist))'),
    (645, 'Totémique', '10021.png', ' (Therian Landorus)', ' (Demeteros (Tiergeist))'),
    (905, 'Totémique', '10249.png', ' (Therian Enamorus)', ' (Enamorus (Tiergeist))'),
    (487, 'Originelle', '10007.png', ' (Origin Giratina)', ' (Ur-Giratina)'),
    (492, 'Céleste', '10006.png', ' (Sky Shaymin)', ' (Shaymin (Zenit))'),
    (720, 'Déchaîné', '10086.png', ' (Hoopa Unbound)', ' (Entfesseltes Hoopa)'),
    (647, 'Décidé', '10024.png', ' (Resolute Keldeo)', ' (Keldeo (Resolut))'),
    (648, 'Danse', '10018.png', ' (Pirouette Meloetta)', ' (Meloetta (Tanz))'),
    (718, '10%', '10181.png', ' (10% Zygarde)', ' (Zygarde (10%))'),
    (718, 'Complete', '10120.png', ' (Complete Zygarde)', ' (Zygarde (Optimum))'),
    (746, 'Banc', '10127.png', ' (School Wishiwashi)', ' (Lusardin (Schwarm))'),
    (778, 'Démasquée', '10143.png', ' (Busted Mimikyu)', ' (Mimigma (Entlarvt))')
)
UPDATE pokemon_master pm
SET 
  image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/' || mu.img,
  name_en = COALESCE((SELECT name_en FROM pokemon_master WHERE pokemon_id = pm.pokemon_id AND form_name = 'Normal'), pm.name_en) || mu.en_suffix,
  name_de = COALESCE((SELECT name_de FROM pokemon_master WHERE pokemon_id = pm.pokemon_id AND form_name = 'Normal'), pm.name_de) || mu.de_suffix
FROM metadata_updates mu
WHERE pm.pokemon_id = mu.pid AND pm.form_name = mu.fname;

-- 5. MEGA, GIGAMAX & DYNAMAX (Dynamic Loops)
DO $$
DECLARE
    p_id INTEGER;
    m_list INTEGER[] := ARRAY[1, 3, 9, 15, 18, 65, 80, 94, 115, 127, 130, 142, 181, 208, 212, 214, 229, 248, 254, 257, 260, 282, 302, 303, 306, 308, 310, 319, 323, 334, 354, 359, 362, 373, 376, 380, 381, 384, 428, 445, 448, 460, 475, 531, 719];
    g_list INTEGER[] := ARRAY[3, 6, 9, 12, 25, 52, 68, 94, 99, 131, 133, 143, 569, 809, 810, 813, 816, 823, 826, 834, 838, 841, 842, 844, 849, 851, 858, 861, 869, 879, 884, 892];
    d_list INTEGER[] := ARRAY[1, 2, 4, 5, 6, 7, 8, 9, 3, 133, 134, 135, 136, 780, 810, 811, 812];
BEGIN
    -- MEGAS
    FOREACH p_id IN ARRAY m_list LOOP
        INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, name_en, name_de, name_it, image_url, classification_id, region_id, type_primary_id, type_secondary_id, trade_status, is_available)
        SELECT p_id, 'Méga', name_fr || ' (Méga)', name_en || ' (Mega)', name_de || ' (Mega)', name_it || ' (Mega)', '/images/pokemon/' || p_id || '_Méga.png', classification_id, region_id, type_primary_id, type_secondary_id, 'NO', TRUE
        FROM pokemon_master WHERE pokemon_id = p_id AND form_name = 'Normal'
        ON CONFLICT (pokemon_id, form_name) DO UPDATE SET trade_status = 'NO';
        
        INSERT INTO pokemon_category_availability (pokemon_id, form_name, can_be_normal, can_be_shiny, can_be_mega)
        VALUES (p_id, 'Méga', TRUE, TRUE, TRUE)
        ON CONFLICT (pokemon_id, form_name) DO UPDATE SET can_be_mega = TRUE, can_be_normal = TRUE;
    END LOOP;

    -- GIGAMAX
    FOREACH p_id IN ARRAY g_list LOOP
        INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, name_en, name_de, name_it, image_url, classification_id, region_id, type_primary_id, type_secondary_id, trade_status, is_available)
        SELECT p_id, 'Gigamax', name_fr || ' (Gigamax)', name_en || ' (Gigantamax)', name_de || ' (Gigadynamax)', name_it || ' (Gigamax)', '/images/pokemon/' || p_id || '_Gigamax.png', classification_id, region_id, type_primary_id, type_secondary_id, 'SPECIAL', TRUE
        FROM pokemon_master WHERE pokemon_id = p_id AND form_name = 'Normal'
        ON CONFLICT (pokemon_id, form_name) DO UPDATE SET trade_status = 'SPECIAL';
        
        INSERT INTO pokemon_category_availability (pokemon_id, form_name, can_be_normal, can_be_shiny, can_be_gmax)
        VALUES (p_id, 'Gigamax', TRUE, TRUE, TRUE)
        ON CONFLICT (pokemon_id, form_name) DO UPDATE SET can_be_gmax = TRUE, can_be_normal = TRUE;
    END LOOP;

    -- DYNAMAX
    FOREACH p_id IN ARRAY d_list LOOP
        INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, name_en, name_de, name_it, image_url, classification_id, region_id, type_primary_id, type_secondary_id, trade_status, is_available)
        SELECT p_id, 'Dynamax', name_fr || ' (Dynamax)', name_en || ' (Dynamax)', name_de || ' (Dynamax)', name_it || ' (Dynamax)', '/images/pokemon/' || p_id || '_Dynamax.png', classification_id, region_id, type_primary_id, type_secondary_id, 'YES', TRUE
        FROM pokemon_master WHERE pokemon_id = p_id AND form_name = 'Normal'
        ON CONFLICT (pokemon_id, form_name) DO UPDATE SET trade_status = 'YES';
        
        INSERT INTO pokemon_category_availability (pokemon_id, form_name, can_be_normal, can_be_shiny, can_be_dynamax, can_be_obscure, can_be_purified)
        VALUES (p_id, 'Dynamax', TRUE, TRUE, TRUE, FALSE, FALSE)
        ON CONFLICT (pokemon_id, form_name) DO UPDATE SET can_be_dynamax = TRUE, can_be_normal = TRUE, can_be_obscure = FALSE, can_be_purified = FALSE;
    END LOOP;
END $$;

-- 6. SPECIAL MEGA FORMS (Charizard & Mewtwo)
INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, name_en, name_de, name_it, image_url, classification_id, region_id, type_primary_id, type_secondary_id, trade_status, is_available)
SELECT 6, n, 'Méga-Dracaufeu ' || s, 'Mega Charizard ' || s, 'Mega-Glurak ' || s, 'Mega Charizard ' || s, '/images/pokemon/6_Méga-Dracaufeu_' || s || '.png', classification_id, region_id, type_primary_id, type_secondary_id, 'NO', TRUE
FROM pokemon_master, (VALUES ('Méga-Dracaufeu X', 'X'), ('Méga-Dracaufeu Y', 'Y')) AS t(n, s) WHERE pokemon_id = 6 AND form_name = 'Normal'
ON CONFLICT (pokemon_id, form_name) DO UPDATE SET trade_status = 'NO';

INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, name_en, name_de, name_it, image_url, classification_id, region_id, type_primary_id, type_secondary_id, trade_status, is_available)
SELECT 150, n, 'Méga-Mewtwo ' || s, 'Mega Mewtwo ' || s, 'Mega-Mewtu ' || s, 'Mega Mewtwo ' || s, '/images/pokemon/150_Méga_' || s || '.png', classification_id, region_id, type_primary_id, type_secondary_id, 'NO', TRUE
FROM pokemon_master, (VALUES ('Méga X', 'X'), ('Méga Y', 'Y')) AS t(n, s) WHERE pokemon_id = 150 AND form_name = 'Normal'
ON CONFLICT (pokemon_id, form_name) DO UPDATE SET trade_status = 'NO';

INSERT INTO pokemon_category_availability (pokemon_id, form_name, can_be_normal, can_be_shiny, can_be_mega)
VALUES (6, 'Méga-Dracaufeu X', TRUE, TRUE, TRUE), (6, 'Méga-Dracaufeu Y', TRUE, TRUE, TRUE), (150, 'Méga X', TRUE, TRUE, TRUE), (150, 'Méga Y', TRUE, TRUE, TRUE)
ON CONFLICT (pokemon_id, form_name) DO UPDATE SET can_be_mega = TRUE, can_be_normal = TRUE;

-- 7. URSHIFU FIXES
DO $$
BEGIN
    -- Handle Styles (892)
    IF EXISTS (SELECT 1 FROM pokemon_master WHERE pokemon_id = 892 AND form_name = 'Normal') THEN
        IF EXISTS (SELECT 1 FROM pokemon_master WHERE pokemon_id = 892 AND form_name = 'Style Poing Final') THEN
            -- If both exist, just delete Normal (it's a duplicate of Single Strike)
            DELETE FROM pokemon_master WHERE pokemon_id = 892 AND form_name = 'Normal';
        ELSE
            -- Rename Normal to Single Strike
            UPDATE pokemon_master SET form_name = 'Style Poing Final', name_fr = 'Shifours (Style Poing Final)', name_en = 'Urshifu (Single Strike Style)' WHERE pokemon_id = 892 AND form_name = 'Normal';
        END IF;
    END IF;

    -- Gigamax Style Poing Final
    IF EXISTS (SELECT 1 FROM pokemon_master WHERE pokemon_id = 892 AND form_name = 'Gigamax') THEN
        IF EXISTS (SELECT 1 FROM pokemon_master WHERE pokemon_id = 892 AND form_name = 'Gigamax (Style Poing Final)') THEN
            DELETE FROM pokemon_master WHERE pokemon_id = 892 AND form_name = 'Gigamax';
        ELSE
            UPDATE pokemon_master SET form_name = 'Gigamax (Style Poing Final)', name_fr = 'Shifours Gigamax (Style Poing Final)', name_en = 'Gigantamax Urshifu (Single Strike Style)' WHERE pokemon_id = 892 AND form_name = 'Gigamax';
        END IF;
    END IF;
END $$;

-- Rapid Strike (Mille Poings) - using ON CONFLICT for safety
INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, name_en, classification_id, region_id, type_primary_id, type_secondary_id, image_url, trade_status, is_available)
SELECT 892, 'Style Mille Poings', 'Shifours (Style Mille Poings)', 'Urshifu (Rapid Strike Style)', classification_id, region_id, 4, 2, '/images/pokemon/892_Style_Mille_Poings.png', 'YES', TRUE
FROM pokemon_master WHERE pokemon_id = 892 AND form_name = 'Style Poing Final'
ON CONFLICT (pokemon_id, form_name) DO NOTHING;

INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, name_en, classification_id, region_id, type_primary_id, type_secondary_id, image_url, trade_status, is_available)
SELECT 892, 'Gigamax (Style Mille Poings)', 'Shifours Gigamax (Style Mille Poings)', 'Gigantamax Urshifu (Rapid Strike Style)', classification_id, region_id, 4, 2, '/images/pokemon/892_Gigamax_Style_Mille_Poings.png', 'SPECIAL', TRUE
FROM pokemon_master WHERE pokemon_id = 892 AND form_name = 'Style Poing Final'
ON CONFLICT (pokemon_id, form_name) DO NOTHING;

-- Dynamax Styles
INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, name_en, classification_id, region_id, type_primary_id, type_secondary_id, image_url, trade_status, is_available)
SELECT 892, 'Dynamax (Style Poing Final)', 'Shifours Dynamax (Style Poing Final)', 'Dynamax Urshifu (Single Strike Style)', classification_id, region_id, type_primary_id, type_secondary_id, '/images/pokemon/892_Dynamax_Style_Poing_Final.png', 'YES', TRUE
FROM pokemon_master WHERE pokemon_id = 892 AND form_name = 'Style Poing Final'
ON CONFLICT (pokemon_id, form_name) DO NOTHING;

INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, name_en, classification_id, region_id, type_primary_id, type_secondary_id, image_url, trade_status, is_available)
SELECT 892, 'Dynamax (Style Mille Poings)', 'Shifours Dynamax (Style Mille Poings)', 'Dynamax Urshifu (Rapid Strike Style)', classification_id, region_id, 4, 2, '/images/pokemon/892_Dynamax_Style_Mille_Poings.png', 'YES', TRUE
FROM pokemon_master WHERE pokemon_id = 892 AND form_name = 'Style Mille Poings'
ON CONFLICT (pokemon_id, form_name) DO NOTHING;

-- PCA for Urshifu styles
INSERT INTO pokemon_category_availability (pokemon_id, form_name, can_be_normal, can_be_shiny, can_be_gmax, can_be_dynamax)
VALUES (892, 'Style Poing Final', TRUE, TRUE, FALSE, FALSE), (892, 'Style Mille Poings', TRUE, TRUE, FALSE, FALSE), (892, 'Gigamax (Style Poing Final)', TRUE, TRUE, TRUE, FALSE), (892, 'Gigamax (Style Mille Poings)', TRUE, TRUE, TRUE, FALSE), (892, 'Dynamax (Style Poing Final)', TRUE, TRUE, FALSE, TRUE), (892, 'Dynamax (Style Mille Poings)', TRUE, TRUE, FALSE, TRUE)
ON CONFLICT (pokemon_id, form_name) DO UPDATE SET can_be_normal = EXCLUDED.can_be_normal, can_be_gmax = EXCLUDED.can_be_gmax, can_be_dynamax = EXCLUDED.can_be_dynamax;

-- 8. USER DATA MIGRATIONS (Pokedex)
-- Migrate Checked statuses for Mega/Gmax/Dynamax
INSERT INTO pokedex (user_id, pokemon_id, form_name, has_normal)
SELECT p.user_id, p.pokemon_id, 'Méga', true FROM pokedex p WHERE p.form_name = 'Normal' AND p.has_mega = true AND p.pokemon_id NOT IN (6, 150)
ON CONFLICT (user_id, pokemon_id, form_name) DO UPDATE SET has_normal = true;

INSERT INTO pokedex (user_id, pokemon_id, form_name, has_normal)
SELECT p.user_id, p.pokemon_id, 'Gigamax', true FROM pokedex p WHERE p.form_name = 'Normal' AND p.has_gmax = true
ON CONFLICT (user_id, pokemon_id, form_name) DO UPDATE SET has_normal = true;

INSERT INTO pokedex (user_id, pokemon_id, form_name, has_normal, has_dynamax, has_trade)
SELECT p.user_id, p.pokemon_id, 'Dynamax', true, true, p.trade_dynamax FROM pokedex p WHERE p.form_name = 'Normal' AND p.has_dynamax = true
ON CONFLICT (user_id, pokemon_id, form_name) DO UPDATE SET has_normal = true, has_dynamax = true, has_trade = EXCLUDED.has_trade;

-- Specific mega migrations
INSERT INTO pokedex (user_id, pokemon_id, form_name, has_normal)
SELECT p.user_id, 6, n, true FROM pokedex p, (VALUES ('Méga-Dracaufeu X'), ('Méga-Dracaufeu Y')) AS t(n) WHERE p.pokemon_id = 6 AND p.form_name = 'Normal' AND p.has_mega = true
ON CONFLICT (user_id, pokemon_id, form_name) DO UPDATE SET has_normal = true;

INSERT INTO pokedex (user_id, pokemon_id, form_name, has_normal)
SELECT p.user_id, 150, n, true FROM pokedex p, (VALUES ('Méga X'), ('Méga Y')) AS t(n) WHERE p.pokemon_id = 150 AND p.form_name = 'Normal' AND p.has_mega = true
ON CONFLICT (user_id, pokemon_id, form_name) DO UPDATE SET has_normal = true;

-- Update has_trade for Mega (NO) and Gigamax (from trade_gmax)
UPDATE pokedex p_mega SET has_trade = false FROM pokedex p_norm WHERE p_mega.user_id = p_norm.user_id AND p_mega.pokemon_id = p_norm.pokemon_id AND p_mega.form_name LIKE 'Méga%' AND p_norm.form_name = 'Normal';
UPDATE pokedex p_gmax SET has_trade = p_norm.trade_gmax FROM pokedex p_norm WHERE p_gmax.user_id = p_norm.user_id AND p_gmax.pokemon_id = p_norm.pokemon_id AND p_gmax.form_name = 'Gigamax' AND p_norm.form_name = 'Normal';

-- Pokedex Urshifu cleanup
DELETE FROM pokedex WHERE pokemon_id = 892 AND form_name = 'Normal' AND EXISTS (SELECT 1 FROM pokedex p2 WHERE p2.user_id = pokedex.user_id AND p2.pokemon_id = 892 AND p2.form_name = 'Style Poing Final');
UPDATE pokedex SET form_name = 'Style Poing Final' WHERE pokemon_id = 892 AND form_name = 'Normal';
DELETE FROM pokedex WHERE pokemon_id = 892 AND form_name = 'Gigamax' AND EXISTS (SELECT 1 FROM pokedex p2 WHERE p2.user_id = pokedex.user_id AND p2.pokemon_id = 892 AND p2.form_name = 'Gigamax (Style Poing Final)');
UPDATE pokedex SET form_name = 'Gigamax (Style Poing Final)' WHERE pokemon_id = 892 AND form_name = 'Gigamax';

-- FINAL CLEANUP of legacy columns on Normal rows
UPDATE pokedex SET has_mega = false, has_gmax = false, has_dynamax = false WHERE form_name = 'Normal';
UPDATE pokemon_category_availability SET can_be_mega = false, can_be_gmax = false, can_be_dynamax = false WHERE form_name = 'Normal';

-- 9. IMAGE URL NORMALIZATION (FINAL STEP)
-- Apply standard naming pattern to all rows unless they have a full URL (from PokeAPI)
UPDATE pokemon_master 
SET image_url = '/images/pokemon/' || pokemon_id || '_' || normalize_form_name(form_name) || '.png'
WHERE image_url NOT LIKE 'http%';

COMMIT;
