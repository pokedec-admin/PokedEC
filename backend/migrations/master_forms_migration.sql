-- MASTER MIGRATION : SUPPORTS DES FORMES POKÉMON & MISES À JOUR IMAGES
-- Date: 2025-12-29
-- Objectif: Structure, Peuplement (Zacian, Zamazenta, etc.) et Uniformisation des URLs Images localement

DO $$ 
BEGIN
    -- 1. Vérification et ajout de la colonne form_name si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pokemon_master' AND column_name='form_name') THEN
        ALTER TABLE pokemon_master ADD COLUMN form_name VARCHAR(50) DEFAULT 'Normal';
    END IF;

    -- 2. Mise à jour de la contrainte unique (pokemon_id + form_name)
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='pokemon_master_pkey' AND table_name='pokemon_master') THEN
        -- Vérifier si la PK est composite (déjà sur id ou déjà sur pokemon_id seul)
        IF (SELECT count(*) FROM information_schema.key_column_usage WHERE constraint_name='pokemon_master_pkey' AND table_name='pokemon_master') = 1 THEN
             -- Si la PK est sur une seule colonne et que c'est pokemon_id, on doit la changer
             IF EXISTS (SELECT 1 FROM information_schema.key_column_usage WHERE constraint_name='pokemon_master_pkey' AND table_name='pokemon_master' AND column_name='pokemon_id') THEN
                ALTER TABLE pokemon_master DROP CONSTRAINT pokemon_master_pkey;
             END IF;
        END IF;
    END IF;

    -- 3. Ajout de la colonne ID auto-incrémentée si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pokemon_master' AND column_name='id') THEN
        ALTER TABLE pokemon_master ADD COLUMN id SERIAL;
    END IF;

    -- 4. Définir la nouvelle PK sur 'id'
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='pokemon_master_pkey' AND table_name='pokemon_master') THEN
        ALTER TABLE pokemon_master ADD PRIMARY KEY (id);
    END IF;

    -- 5. Ajouter la contrainte unique sur (pokemon_id, form_name)
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='unique_pokemon_form' AND table_name='pokemon_master') THEN
        ALTER TABLE pokemon_master ADD CONSTRAINT unique_pokemon_form UNIQUE (pokemon_id, form_name);
    END IF;

    -- 6. Ajouter les colonnes de métadonnées si manquantes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pokemon_master' AND column_name='image_url') THEN
        ALTER TABLE pokemon_master ADD COLUMN image_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pokemon_master' AND column_name='regional_description') THEN
        ALTER TABLE pokemon_master ADD COLUMN regional_description TEXT;
    END IF;
END $$;

-- 7. PEUPLEMENT DES RÉGIONS MANQUANTES
INSERT INTO regions (name_key, name_fr, name_en, display_order, is_custom) VALUES
('paldea', 'Paldea', 'Paldea', 10, FALSE)
ON CONFLICT (name_key) DO NOTHING;

-- 8. PEUPLEMENT DES FORMES (Si non existantes)

-- Generation 1-7 (Alola)
INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, classification_id, region_id, type_primary_id, type_secondary_id)
SELECT pokemon_id, 'Alola', name_fr || ' (Alola)', classification_id, 7, type_primary_id, type_secondary_id FROM pokemon_master WHERE pokemon_id IN (19,20,26,27,28,37,38,50,51,52,53,74,75,76,88,89,103,105) AND form_name = 'Normal'
ON CONFLICT (pokemon_id, form_name) DO NOTHING;

-- Generation 1-8 (Galar)
INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, classification_id, region_id, type_primary_id, type_secondary_id)
SELECT pokemon_id, 'Galar', name_fr || ' (Galar)', classification_id, 8, type_primary_id, type_secondary_id FROM pokemon_master WHERE pokemon_id IN (52,77,78,79,80,83,110,122,144,145,146,263,264,554,555,562,618) AND form_name = 'Normal'
ON CONFLICT (pokemon_id, form_name) DO NOTHING;

-- Generation 1-8 (Hisui)
INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, classification_id, region_id, type_primary_id, type_secondary_id)
SELECT pokemon_id, 'Hisui', name_fr || ' (Hisui)', classification_id, 9, type_primary_id, type_secondary_id FROM pokemon_master WHERE pokemon_id IN (58,59,100,101,157,211,503,548,549,570,571,627,628,705,706,712,713,724) AND form_name = 'Normal'
ON CONFLICT (pokemon_id, form_name) DO NOTHING;

-- Generation 9 (Paldea)
INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, classification_id, region_id, type_primary_id, type_secondary_id)
SELECT pokemon_id, 'Paldea', name_fr || ' (Paldea)', classification_id, 10, type_primary_id, type_secondary_id FROM pokemon_master WHERE pokemon_id IN (194) AND form_name = 'Normal'
ON CONFLICT (pokemon_id, form_name) DO NOTHING;

-- Legends & Special Forms
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
SELECT 888, 'Épée Suprême', 'Zacian (Épée Suprême)', 2, 8, 6, 1 FROM pokemon_master WHERE pokemon_id = 888 AND form_name = 'Normal'
ON CONFLICT (pokemon_id, form_name) DO NOTHING;

INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, classification_id, region_id, type_primary_id, type_secondary_id)
SELECT 889, 'Bouclier Suprême', 'Zamazenta (Bouclier Suprême)', 2, 8, 2, 1 FROM pokemon_master WHERE pokemon_id = 889 AND form_name = 'Normal'
ON CONFLICT (pokemon_id, form_name) DO NOTHING;

INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, classification_id, region_id, type_primary_id, type_secondary_id)
SELECT 741, f, 'Plumeline (' || f || ')', 1, 7, 5, 18 FROM (VALUES ('Pom-Pom'), ('Hula'), ('Buyō')) AS t(f) -- simplified types for now, will update below
ON CONFLICT (pokemon_id, form_name) DO NOTHING;

-- 9. MISES À JOUR DES DONNÉES SPÉCIFIQUES (Types & Régions)
-- Basé sur create_types.sql (1: Steel, 2: Fighting, 3: Dragon, 4: Water, 5: Electric, 6: Fairy, 7: Fire, 8: Ice, 13: Psychic, 17: Dark, etc.)

-- Alola
UPDATE pokemon_master SET type_primary_id = 5, type_secondary_id = 13, region_id = 7 WHERE pokemon_id = 26 AND form_name = 'Alola';  -- Raichu
UPDATE pokemon_master SET type_primary_id = 8, type_secondary_id = 6, region_id = 7 WHERE pokemon_id = 38 AND form_name = 'Alola';   -- Feunard
UPDATE pokemon_master SET type_primary_id = 8, type_secondary_id = NULL, region_id = 7 WHERE pokemon_id = 37 AND form_name = 'Alola';-- Goupix
UPDATE pokemon_master SET type_primary_id = 17, type_secondary_id = 10, region_id = 7 WHERE pokemon_id = 19 AND form_name = 'Alola'; -- Rattata
UPDATE pokemon_master SET type_primary_id = 8, type_secondary_id = 1, region_id = 7 WHERE pokemon_id = 27 AND form_name = 'Alola';  -- Sabelette

-- Galar
UPDATE pokemon_master SET type_primary_id = 12, type_secondary_id = 6, region_id = 8 WHERE pokemon_id = 110 AND form_name = 'Galar'; -- Smogmog
UPDATE pokemon_master SET type_primary_id = 6, type_secondary_id = 1, region_id = 8 WHERE pokemon_id = 888 AND form_name = 'Épée Suprême'; -- Zacian
UPDATE pokemon_master SET type_primary_id = 2, type_secondary_id = 1, region_id = 8 WHERE pokemon_id = 889 AND form_name = 'Bouclier Suprême'; -- Zamazenta

-- Paldea
UPDATE pokemon_master SET type_primary_id = 12, type_secondary_id = 15, region_id = 10 WHERE pokemon_id = 194 AND form_name = 'Paldea'; -- Axoloto

-- Oricorio
UPDATE pokemon_master SET type_primary_id = 5, type_secondary_id = 18, region_id = 7 WHERE pokemon_id = 741 AND form_name = 'Pom-Pom';
UPDATE pokemon_master SET type_primary_id = 13, type_secondary_id = 18, region_id = 7 WHERE pokemon_id = 741 AND form_name = 'Hula';
UPDATE pokemon_master SET type_primary_id = 16, type_secondary_id = 18, region_id = 7 WHERE pokemon_id = 741 AND form_name = 'Buyō';

-- 10. MISE À JOUR MASSIVE DES URLs IMAGES (FRONTEND LOCAL)
UPDATE pokemon_master 
SET image_url = '/images/pokemon/' || pokemon_id || '_' || REPLACE(form_name, ' ', '_') || '.png';

-- Exception pour les noms de fichiers qui pourraient avoir des apostrophes ou autres (ex: Ailes de l'Aurore)
-- Mais mon replace s'occupe déjà des espaces. Si l'apostrophe est restée, c'est bon si le fichier l'a aussi.
-- J'ai vu "800_Ailes_de_l'Aurore.png" dans le dossier, donc c'est correct.
