-- 1. REGIONAL FORMS
-- Alola
INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, classification_id, region_id, type_primary_id, type_secondary_id, is_regional, regional_description)
SELECT pokemon_id, 'Alola', name_fr || ' (Alola)', classification_id, region_id, type_primary_id, type_secondary_id, TRUE, 'Forme régionale d''Alola' 
FROM pokemon_master 
WHERE pokemon_id IN (19, 20, 26, 27, 28, 37, 38, 50, 51, 52, 53, 74, 75, 76, 88, 89, 103, 105) AND form_name = 'Normal'
ON CONFLICT (pokemon_id, form_name) DO UPDATE SET is_regional = TRUE, regional_description = 'Forme régionale d''Alola';

-- Galar
INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, classification_id, region_id, type_primary_id, type_secondary_id, is_regional, regional_description)
SELECT pokemon_id, 'Galar', name_fr || ' (Galar)', classification_id, region_id, type_primary_id, type_secondary_id, TRUE, 'Forme régionale de Galar' 
FROM pokemon_master 
WHERE pokemon_id IN (52, 77, 78, 79, 80, 83, 110, 122, 144, 145, 146, 199, 222, 263, 264, 554, 555, 562, 618) AND form_name = 'Normal'
ON CONFLICT (pokemon_id, form_name) DO UPDATE SET is_regional = TRUE, regional_description = 'Forme régionale de Galar';

-- Hisui
INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, classification_id, region_id, type_primary_id, type_secondary_id, is_regional, regional_description)
SELECT pokemon_id, 'Hisui', name_fr || ' (Hisui)', classification_id, region_id, type_primary_id, type_secondary_id, TRUE, 'Forme régionale de Hisui' 
FROM pokemon_master 
WHERE pokemon_id IN (58, 59, 100, 101, 157, 211, 215, 503, 549, 570, 571, 627, 628, 705, 706, 713, 724) AND form_name = 'Normal'
ON CONFLICT (pokemon_id, form_name) DO UPDATE SET is_regional = TRUE, regional_description = 'Forme régionale de Hisui';

-- Paldea
INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, classification_id, region_id, type_primary_id, type_secondary_id, is_regional, regional_description)
SELECT pokemon_id, 'Paldea', name_fr || ' (Paldea)', classification_id, region_id, type_primary_id, type_secondary_id, TRUE, 'Forme régionale de Paldea' 
FROM pokemon_master 
WHERE pokemon_id IN (128, 194) AND form_name = 'Normal'
ON CONFLICT (pokemon_id, form_name) DO UPDATE SET is_regional = TRUE, regional_description = 'Forme régionale de Paldea';

-- 2. UNOWN (ZARBI) - 28 forms
-- We already have Normal (usually A), let's add the rest.
INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, classification_id, region_id, type_primary_id, type_secondary_id)
SELECT 201, f, 'Zarbi (' || f || ')', classification_id, region_id, type_primary_id, type_secondary_id 
FROM pokemon_master, (VALUES ('B'),('C'),('D'),('E'),('F'),('G'),('H'),('I'),('J'),('K'),('L'),('M'),('N'),('O'),('P'),('Q'),('R'),('S'),('T'),('U'),('V'),('W'),('X'),('Y'),('Z'),('!'),('?')) AS t(f)
WHERE pokemon_id = 201 AND form_name = 'Normal'
ON CONFLICT (pokemon_id, form_name) DO NOTHING;
-- Update Normal to A for clarity? Maybe later.

-- 3. CASTFORM (MORPHÉO)
INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, classification_id, region_id, type_primary_id, type_secondary_id)
SELECT 351, f, 'Morphéo (' || f || ')', classification_id, region_id, type_primary_id, type_secondary_id 
FROM pokemon_master, (VALUES ('Solaire'),('Eau de Pluie'),('Blizzard')) AS t(f)
WHERE pokemon_id = 351 AND form_name = 'Normal'
ON CONFLICT (pokemon_id, form_name) DO NOTHING;

-- 4. DEOXYS
INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, classification_id, region_id, type_primary_id, type_secondary_id)
SELECT 386, f, 'Deoxys (' || f || ')', classification_id, region_id, type_primary_id, type_secondary_id 
FROM pokemon_master, (VALUES ('Attaque'),('Défense'),('Vitesse')) AS t(f)
WHERE pokemon_id = 386 AND form_name = 'Normal'
ON CONFLICT (pokemon_id, form_name) DO NOTHING;

-- 5. ORICORIO (PLUMELINE)
INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, classification_id, region_id, type_primary_id, type_secondary_id)
SELECT 741, f, 'Plumeline (' || f || ')', classification_id, region_id, type_primary_id, type_secondary_id 
FROM pokemon_master, (VALUES ('Pom-Pom'),('Hula'),('Buyō')) AS t(f)
WHERE pokemon_id = 741 AND form_name = 'Normal'
ON CONFLICT (pokemon_id, form_name) DO NOTHING;

-- 6. BURMY / WORMADAM (CHENITI / CHENISELLE)
INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, classification_id, region_id, type_primary_id, type_secondary_id)
SELECT 412, f, 'Cheniti (' || f || ')', classification_id, region_id, type_primary_id, type_secondary_id 
FROM pokemon_master, (VALUES ('Sable'),('Déchet')) AS t(f)
WHERE pokemon_id = 412 AND form_name = 'Normal'
ON CONFLICT (pokemon_id, form_name) DO NOTHING;

INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, classification_id, region_id, type_primary_id, type_secondary_id)
SELECT 413, f, 'Cheniselle (' || f || ')', classification_id, region_id, type_primary_id, type_secondary_id 
FROM pokemon_master, (VALUES ('Sable'),('Déchet')) AS t(f)
WHERE pokemon_id = 413 AND form_name = 'Normal'
ON CONFLICT (pokemon_id, form_name) DO NOTHING;

-- 7. CHERRIM (CERIBOU -> CERIFLOR)
INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, classification_id, region_id, type_primary_id, type_secondary_id)
SELECT 421, 'Ensoleillée', 'Ceriflor (Ensoleillée)', classification_id, region_id, type_primary_id, type_secondary_id 
FROM pokemon_master WHERE pokemon_id = 421 AND form_name = 'Normal'
ON CONFLICT (pokemon_id, form_name) DO NOTHING;

-- 8. SHELLOS / GASTRODON (SANCOKI / TRITOSOR)
INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, classification_id, region_id, type_primary_id, type_secondary_id)
SELECT 422, 'Orient', 'Sancoki (Orient)', classification_id, region_id, type_primary_id, type_secondary_id 
FROM pokemon_master WHERE pokemon_id = 422 AND form_name = 'Normal'
ON CONFLICT (pokemon_id, form_name) DO NOTHING;

INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, classification_id, region_id, type_primary_id, type_secondary_id)
SELECT 423, 'Orient', 'Tritosor (Orient)', classification_id, region_id, type_primary_id, type_secondary_id 
FROM pokemon_master WHERE pokemon_id = 423 AND form_name = 'Normal'
ON CONFLICT (pokemon_id, form_name) DO NOTHING;

-- 9. ROTOM (MOTISMA)
INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, classification_id, region_id, type_primary_id, type_secondary_id)
SELECT 479, f, 'Motisma (' || f || ')', classification_id, region_id, type_primary_id, type_secondary_id 
FROM pokemon_master, (VALUES ('Chaleur'),('Lavage'),('Froid'),('Hélice'),('Tonte')) AS t(f)
WHERE pokemon_id = 479 AND form_name = 'Normal'
ON CONFLICT (pokemon_id, form_name) DO NOTHING;

-- 10. DEERLING / SAWSBUCK (VIVALDAIM / HAYDAIM)
INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, classification_id, region_id, type_primary_id, type_secondary_id)
SELECT 585, f, 'Vivaldaim (' || f || ')', classification_id, region_id, type_primary_id, type_secondary_id 
FROM pokemon_master, (VALUES ('Été'),('Automne'),('Hiver')) AS t(f)
WHERE pokemon_id = 585 AND form_name = 'Normal'
ON CONFLICT (pokemon_id, form_name) DO NOTHING;

INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, classification_id, region_id, type_primary_id, type_secondary_id)
SELECT 586, f, 'Haydaim (' || f || ')', classification_id, region_id, type_primary_id, type_secondary_id 
FROM pokemon_master, (VALUES ('Été'),('Automne'),('Hiver')) AS t(f)
WHERE pokemon_id = 586 AND form_name = 'Normal'
ON CONFLICT (pokemon_id, form_name) DO NOTHING;

-- 11. FURFROU (COUAFAREL) - 10 forms
INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, classification_id, region_id, type_primary_id, type_secondary_id)
SELECT 676, f, 'Couafarel (' || f || ')', classification_id, region_id, type_primary_id, type_secondary_id 
FROM pokemon_master, (VALUES ('Cœur'),('Étoile'),('Diamant'),('Demoiselle'),('Madame'),('Monsieur'),('Reine'),('Kabuki'),('Pharaon')) AS t(f)
WHERE pokemon_id = 676 AND form_name = 'Normal'
ON CONFLICT (pokemon_id, form_name) DO NOTHING;

-- 12. VIVILLON (PRISMILLON) - 20 forms
INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, classification_id, region_id, type_primary_id, type_secondary_id)
SELECT 666, f, 'Prismillon (' || f || ')', classification_id, region_id, type_primary_id, type_secondary_id 
FROM pokemon_master, (VALUES ('Archipel'),('Banquise'),('Blizzard'),('Continent'),('Cyclone'),('Delta'),('Fantaisie'),('Floraison'),('Glace'),('Jungle'),('Mangrove'),('Métropole'),('Monarchie'),('Poké Ball'),('Rivage'),('Sable'),('Sécheresse'),('Soleil Levant'),('Verdure'),('Zénith')) AS t(f)
WHERE pokemon_id = 666 AND form_name = 'Normal'
ON CONFLICT (pokemon_id, form_name) DO NOTHING;

-- 13. PUMP KABOO / GOURGEIST (PITROUILLE / BANSHITROUYE)
INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, classification_id, region_id, type_primary_id, type_secondary_id)
SELECT 710, f, 'Pitrouille (' || f || ')', classification_id, region_id, type_primary_id, type_secondary_id 
FROM pokemon_master, (VALUES ('Petit'),('Grand'),('Ultra')) AS t(f)
WHERE pokemon_id = 710 AND form_name = 'Normal'
ON CONFLICT (pokemon_id, form_name) DO NOTHING;

INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, classification_id, region_id, type_primary_id, type_secondary_id)
SELECT 711, f, 'Banshitrouye (' || f || ')', classification_id, region_id, type_primary_id, type_secondary_id 
FROM pokemon_master, (VALUES ('Petit'),('Grand'),('Ultra')) AS t(f)
WHERE pokemon_id = 711 AND form_name = 'Normal'
ON CONFLICT (pokemon_id, form_name) DO NOTHING;

-- 14. ROCKRUFF / LYCANROC (ROCABOT / LOUGAROC)
INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, classification_id, region_id, type_primary_id, type_secondary_id)
SELECT 745, f, 'Lougaroc (' || f || ')', classification_id, region_id, type_primary_id, type_secondary_id 
FROM pokemon_master, (VALUES ('Nocturne'),('Crépusculaire')) AS t(f)
WHERE pokemon_id = 745 AND form_name = 'Normal'
ON CONFLICT (pokemon_id, form_name) DO NOTHING;

-- 15. FLABÉBÉ family
INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, classification_id, region_id, type_primary_id, type_secondary_id)
SELECT 669, f, 'Flabébé (' || f || ')', classification_id, region_id, type_primary_id, type_secondary_id 
FROM pokemon_master, (VALUES ('Jaune'),('Orange'),('Bleue'),('Blanche')) AS t(f)
WHERE pokemon_id = 669 AND form_name = 'Normal'
ON CONFLICT (pokemon_id, form_name) DO NOTHING;

INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, classification_id, region_id, type_primary_id, type_secondary_id)
SELECT 670, f, 'Floette (' || f || ')', classification_id, region_id, type_primary_id, type_secondary_id 
FROM pokemon_master, (VALUES ('Jaune'),('Orange'),('Bleue'),('Blanche')) AS t(f)
WHERE pokemon_id = 670 AND form_name = 'Normal'
ON CONFLICT (pokemon_id, form_name) DO NOTHING;

INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, classification_id, region_id, type_primary_id, type_secondary_id)
SELECT 671, f, 'Florges (' || f || ')', classification_id, region_id, type_primary_id, type_secondary_id 
FROM pokemon_master, (VALUES ('Jaune'),('Orange'),('Bleue'),('Blanche')) AS t(f)
WHERE pokemon_id = 671 AND form_name = 'Normal'
ON CONFLICT (pokemon_id, form_name) DO NOTHING;
