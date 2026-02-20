-- REMEDIATION: FIX REGIONAL CHARACTERISTIC
-- Date: 2025-12-23
-- Goal: Correct the 'is_regional' flag which was wrongly over-populated.
-- Regional forms (Alola, Galar, Hisui) are NOT the same as Pokémon GO regional exclusives.

BEGIN;

-- 1. Reset all regional flags
UPDATE pokemon_master SET is_regional = FALSE, regional_description = NULL;

-- 2. Apply True Regional Exclusives (approx 45 species + specific forms)
-- Data based on populate_regional_data.sql which is the correct source

-- Gen 1
UPDATE pokemon_master SET is_regional = TRUE, regional_description = 'Asie' WHERE pokemon_id = 83 AND form_name = 'Normal'; -- Canarticho
UPDATE pokemon_master SET is_regional = TRUE, regional_description = 'Australie' WHERE pokemon_id = 115 AND form_name = 'Normal'; -- Kangourex
UPDATE pokemon_master SET is_regional = TRUE, regional_description = 'Europe' WHERE pokemon_id = 122 AND form_name = 'Normal'; -- M. Mime
UPDATE pokemon_master SET is_regional = TRUE, regional_description = 'Amérique du Nord' WHERE pokemon_id = 128 AND form_name = 'Normal'; -- Tauros

-- Gen 2
UPDATE pokemon_master SET is_regional = TRUE, regional_description = 'Amérique du Nord et Amérique Centrale' WHERE pokemon_id = 214; -- Scarhino
UPDATE pokemon_master SET is_regional = TRUE, regional_description = 'Amérique Centrale et Îles Canaries' WHERE pokemon_id = 222 AND form_name = 'Normal'; -- Corayon

-- Gen 3
UPDATE pokemon_master SET is_regional = TRUE, regional_description = 'Europe, Asie et Australie' WHERE pokemon_id = 313; -- Muciole
UPDATE pokemon_master SET is_regional = TRUE, regional_description = 'Amérique, Afrique et Îles Canaries' WHERE pokemon_id = 314; -- Lumivole
UPDATE pokemon_master SET is_regional = TRUE, regional_description = 'Inde et Asie du Sud' WHERE pokemon_id = 324; -- Chartor
UPDATE pokemon_master SET is_regional = TRUE, regional_description = 'Europe, Asie et Australie' WHERE pokemon_id = 335; -- Mangriff
UPDATE pokemon_master SET is_regional = TRUE, regional_description = 'Amérique et Afrique' WHERE pokemon_id = 336; -- Seviper
UPDATE pokemon_master SET is_regional = TRUE, regional_description = 'Hémisphère Ouest' WHERE pokemon_id = 337; -- Séléroc
UPDATE pokemon_master SET is_regional = TRUE, regional_description = 'Hémisphère Est' WHERE pokemon_id = 338; -- Solaroc
UPDATE pokemon_master SET is_regional = TRUE, regional_description = 'Afrique, Sud de l''Espagne et Îles Canaries' WHERE pokemon_id = 357; -- Tropius
UPDATE pokemon_master SET is_regional = TRUE, regional_description = 'Nouvelle-Zélande' WHERE pokemon_id = 369; -- Relicanth

-- Gen 4
UPDATE pokemon_master SET is_regional = TRUE, regional_description = 'Canada, Russie et Alaska' WHERE pokemon_id = 417; -- Pachirisu
UPDATE pokemon_master SET is_regional = TRUE, regional_description = 'Hémisphère Ouest (Mer de l''Ouest)' WHERE pokemon_id IN (422, 423) AND (form_name = 'Occident' OR form_name = 'Normal'); -- Sancoki/Tritosor Ouest
UPDATE pokemon_master SET is_regional = TRUE, regional_description = 'Hémisphère Est (Mer de l''Est)' WHERE pokemon_id IN (422, 423) AND form_name = 'Orient'; -- Sancoki/Tritosor Est
UPDATE pokemon_master SET is_regional = TRUE, regional_description = 'Hémisphère Sud' WHERE pokemon_id = 441; -- Pijako
UPDATE pokemon_master SET is_regional = TRUE, regional_description = 'Sud-Est des États-Unis' WHERE pokemon_id = 455; -- Vortente
UPDATE pokemon_master SET is_regional = TRUE, regional_description = 'Asie et Pacifique' WHERE pokemon_id = 480; -- Créhelf
UPDATE pokemon_master SET is_regional = TRUE, regional_description = 'Europe, Afrique et Inde' WHERE pokemon_id = 481; -- Créfollet
UPDATE pokemon_master SET is_regional = TRUE, regional_description = 'Amérique et Groenland' WHERE pokemon_id = 482; -- Créfadet

-- Gen 5
UPDATE pokemon_master SET is_regional = TRUE, regional_description = 'Asie et Pacifique' WHERE pokemon_id IN (511, 512); -- Feuillajou/Feuiloutan
UPDATE pokemon_master SET is_regional = TRUE, regional_description = 'Europe, Moyen-Orient, Afrique et Inde' WHERE pokemon_id IN (513, 514); -- Flamajou/Flamoutan
UPDATE pokemon_master SET is_regional = TRUE, regional_description = 'Amérique et Groenland' WHERE pokemon_id IN (515, 516); -- Flotajou/Flotoutan
UPDATE pokemon_master SET is_regional = TRUE, regional_description = 'Amérique (Nord et Sud) et Afrique' WHERE pokemon_id = 538; -- Judokrak
UPDATE pokemon_master SET is_regional = TRUE, regional_description = 'Europe, Asie et Australie' WHERE pokemon_id = 539; -- Karaclée
UPDATE pokemon_master SET is_regional = TRUE, regional_description = 'Amérique/Afrique (Motif Rouge)' WHERE pokemon_id = 550 AND (form_name = 'Normal' OR form_name = 'Banc'); -- Bargantua Rouge (Normal)
UPDATE pokemon_master SET is_regional = TRUE, regional_description = 'Europe/Asie/Australie (Motif Bleu)' WHERE pokemon_id = 550 AND form_name = 'Bleu'; -- Bargantua Bleu
UPDATE pokemon_master SET is_regional = TRUE, regional_description = 'États-Unis (Sud), Mexique, Amérique (Centre et Sud) et Caraïbes' WHERE pokemon_id = 556; -- Maracachi
UPDATE pokemon_master SET is_regional = TRUE, regional_description = 'Égypte et Grèce' WHERE pokemon_id = 561; -- Cryptéro
UPDATE pokemon_master SET is_regional = TRUE, regional_description = 'New-York' WHERE pokemon_id = 626; -- Frison
UPDATE pokemon_master SET is_regional = TRUE, regional_description = 'Hémisphère Est' WHERE pokemon_id = 631; -- Aflamanoir
UPDATE pokemon_master SET is_regional = TRUE, regional_description = 'Hémisphère Ouest' WHERE pokemon_id = 632; -- Fermite

-- Gen 6
UPDATE pokemon_master SET is_regional = TRUE, regional_description = 'Europe, Moyen-Orient et Afrique' WHERE pokemon_id = 669 AND (TRIM(form_name) = 'Normal' OR TRIM(form_name) = 'Rouge'); 
UPDATE pokemon_master SET is_regional = TRUE, regional_description = 'Asie-Pacifique' WHERE pokemon_id = 669 AND TRIM(form_name) = 'Bleue'; 
UPDATE pokemon_master SET is_regional = TRUE, regional_description = 'Amérique' WHERE pokemon_id = 669 AND TRIM(form_name) = 'Jaune'; 
UPDATE pokemon_master SET is_regional = TRUE, regional_description = 'France (Motif Cœur/Star/etc.)' WHERE pokemon_id = 676 AND TRIM(form_name) != 'Normal'; 
UPDATE pokemon_master SET is_regional = TRUE, regional_description = 'Mexique' WHERE pokemon_id = 701; 
UPDATE pokemon_master SET is_regional = TRUE, regional_description = 'France' WHERE pokemon_id = 707; 

-- Gen 7
UPDATE pokemon_master SET is_regional = TRUE, regional_description = 'Europe, Moyen-Orient et Afrique' WHERE pokemon_id = 741 AND TRIM(form_name) = 'Normal'; 
UPDATE pokemon_master SET is_regional = TRUE, regional_description = 'Amérique' WHERE pokemon_id = 741 AND TRIM(form_name) = 'Pom-Pom'; 
UPDATE pokemon_master SET is_regional = TRUE, regional_description = 'Îles africaines, asiatiques et pacifiques' WHERE pokemon_id = 741 AND TRIM(form_name) = 'Hula'; 
UPDATE pokemon_master SET is_regional = TRUE, regional_description = 'Asie' WHERE pokemon_id = 741 AND TRIM(form_name) = 'Buyō'; 
UPDATE pokemon_master SET is_regional = TRUE, regional_description = 'Hawaï' WHERE pokemon_id = 764; -- Guérilande
UPDATE pokemon_master SET is_regional = TRUE, regional_description = 'Hémisphère Sud' WHERE pokemon_id = 797; -- Bamboiselle
UPDATE pokemon_master SET is_regional = TRUE, regional_description = 'Hémisphère Nord' WHERE pokemon_id = 798; -- Katagami

COMMIT;
