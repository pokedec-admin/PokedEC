-- 16. KYUREM
INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, classification_id, region_id, type_primary_id, type_secondary_id)
SELECT 646, f, 'Kyurem (' || f || ')', classification_id, region_id, type_primary_id, type_secondary_id
FROM pokemon_master, (VALUES ('Noir'),('Blanc')) AS t(f)
WHERE pokemon_id = 646 AND form_name = 'Normal'
ON CONFLICT (pokemon_id, form_name) DO NOTHING;

-- 17. ZACIAN
-- Forme de base est Héros. Forme épée est "Épée Suprême".
INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, classification_id, region_id, type_primary_id, type_secondary_id)
SELECT 888, 'Épée Suprême', 'Zacian (Épée Suprême)', classification_id, region_id, type_primary_id, type_secondary_id
FROM pokemon_master
WHERE pokemon_id = 888 AND form_name = 'Normal'
ON CONFLICT (pokemon_id, form_name) DO NOTHING;

-- 18. ZAMAZENTA
INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, classification_id, region_id, type_primary_id, type_secondary_id)
SELECT 889, 'Bouclier Suprême', 'Zamazenta (Bouclier Suprême)', classification_id, region_id, type_primary_id, type_secondary_id
FROM pokemon_master
WHERE pokemon_id = 889 AND form_name = 'Normal'
ON CONFLICT (pokemon_id, form_name) DO NOTHING;

-- 19. NECROZMA
INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, classification_id, region_id, type_primary_id, type_secondary_id)
SELECT 800, f, 'Necrozma (' || f || ')', classification_id, region_id, type_primary_id, type_secondary_id
FROM pokemon_master, (VALUES ('Crinière du Couchant'),('Ailes de l''Aurore'),('Ultra')) AS t(f)
WHERE pokemon_id = 800 AND form_name = 'Normal'
ON CONFLICT (pokemon_id, form_name) DO NOTHING;

-- 20. CALYREX
INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, classification_id, region_id, type_primary_id, type_secondary_id)
SELECT 898, f, 'Calyrex (' || f || ')', classification_id, region_id, type_primary_id, type_secondary_id
FROM pokemon_master, (VALUES ('Cavalier du Froid'),('Cavalier d''Effroi')) AS t(f)
WHERE pokemon_id = 898 AND form_name = 'Normal'
ON CONFLICT (pokemon_id, form_name) DO NOTHING;

-- 21. GIRATINA
INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, classification_id, region_id, type_primary_id, type_secondary_id)
SELECT 487, 'Originelle', 'Giratina (Originelle)', classification_id, region_id, type_primary_id, type_secondary_id
FROM pokemon_master
WHERE pokemon_id = 487 AND form_name = 'Normal'
ON CONFLICT (pokemon_id, form_name) DO NOTHING;

-- 22. SHAYMIN
INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, classification_id, region_id, type_primary_id, type_secondary_id)
SELECT 492, 'Céleste', 'Shaymin (Céleste)', classification_id, region_id, type_primary_id, type_secondary_id
FROM pokemon_master
WHERE pokemon_id = 492 AND form_name = 'Normal'
ON CONFLICT (pokemon_id, form_name) DO NOTHING;

-- 23. TORNADUS / THUNDURUS / LANDORUS (GÉNIES)
-- Boréas
INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, classification_id, region_id, type_primary_id, type_secondary_id)
SELECT 641, 'Totémique', 'Boréas (Totémique)', classification_id, region_id, type_primary_id, type_secondary_id
FROM pokemon_master WHERE pokemon_id = 641 AND form_name = 'Normal'
ON CONFLICT (pokemon_id, form_name) DO NOTHING;
-- Fulguris
INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, classification_id, region_id, type_primary_id, type_secondary_id)
SELECT 642, 'Totémique', 'Fulguris (Totémique)', classification_id, region_id, type_primary_id, type_secondary_id
FROM pokemon_master WHERE pokemon_id = 642 AND form_name = 'Normal'
ON CONFLICT (pokemon_id, form_name) DO NOTHING;
-- Démétéros
INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, classification_id, region_id, type_primary_id, type_secondary_id)
SELECT 645, 'Totémique', 'Démétéros (Totémique)', classification_id, region_id, type_primary_id, type_secondary_id
FROM pokemon_master WHERE pokemon_id = 645 AND form_name = 'Normal'
ON CONFLICT (pokemon_id, form_name) DO NOTHING;
-- Amovénus
INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, classification_id, region_id, type_primary_id, type_secondary_id)
SELECT 905, 'Totémique', 'Amovénus (Totémique)', classification_id, region_id, type_primary_id, type_secondary_id
FROM pokemon_master WHERE pokemon_id = 905 AND form_name = 'Normal'
ON CONFLICT (pokemon_id, form_name) DO NOTHING;

-- 24. KELDEO
INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, classification_id, region_id, type_primary_id, type_secondary_id)
SELECT 647, 'Décidé', 'Keldeo (Décidé)', classification_id, region_id, type_primary_id, type_secondary_id
FROM pokemon_master WHERE pokemon_id = 647 AND form_name = 'Normal'
ON CONFLICT (pokemon_id, form_name) DO NOTHING;

-- 25. MELOETTA
INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, classification_id, region_id, type_primary_id, type_secondary_id)
SELECT 648, 'Danse', 'Meloetta (Danse)', classification_id, region_id, type_primary_id, type_secondary_id
FROM pokemon_master WHERE pokemon_id = 648 AND form_name = 'Normal'
ON CONFLICT (pokemon_id, form_name) DO NOTHING;

-- 26. HOOPA
INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, classification_id, region_id, type_primary_id, type_secondary_id)
SELECT 720, 'Déchaîné', 'Hoopa (Déchaîné)', classification_id, region_id, type_primary_id, type_secondary_id
FROM pokemon_master WHERE pokemon_id = 720 AND form_name = 'Normal'
ON CONFLICT (pokemon_id, form_name) DO NOTHING;

-- 27. ZYGARDE
INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, classification_id, region_id, type_primary_id, type_secondary_id)
SELECT 718, f, 'Zygarde (' || f || ')', classification_id, region_id, type_primary_id, type_secondary_id
FROM pokemon_master, (VALUES ('10%'),('Complete')) AS t(f)
WHERE pokemon_id = 718 AND form_name = 'Normal'
ON CONFLICT (pokemon_id, form_name) DO NOTHING;

-- 28. WISHIWASHI (FROUSSARD)
INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, classification_id, region_id, type_primary_id, type_secondary_id)
SELECT 746, 'Banc', 'Froussard (Banc)', classification_id, region_id, type_primary_id, type_secondary_id
FROM pokemon_master WHERE pokemon_id = 746 AND form_name = 'Normal'
ON CONFLICT (pokemon_id, form_name) DO NOTHING;

-- 29. MIMIKYU (MIMIQUI)
INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, classification_id, region_id, type_primary_id, type_secondary_id)
SELECT 778, 'Démasquée', 'Mimiqui (Démasquée)', classification_id, region_id, type_primary_id, type_secondary_id
FROM pokemon_master WHERE pokemon_id = 778 AND form_name = 'Normal'
ON CONFLICT (pokemon_id, form_name) DO NOTHING;

-- 30. URSHIFU (SHIFOURS)
-- Si Base est Poing Final (Dark), l'autre est Mille Poings (Water)
-- On assume que le Normal est l'un des deux. Ajoutons les deux explicitement si needed, mais "Normal" existe deja.
-- Ajoutons "Mille Poings" si Normal est Poing Final.
INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, classification_id, region_id, type_primary_id, type_secondary_id)
SELECT 892, 'Mille Poings', 'Shifours (Mille Poings)', classification_id, region_id, type_primary_id, type_secondary_id
FROM pokemon_master WHERE pokemon_id = 892 AND form_name = 'Normal'
ON CONFLICT (pokemon_id, form_name) DO NOTHING;
