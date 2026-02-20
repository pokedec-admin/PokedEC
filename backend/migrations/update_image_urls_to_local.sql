-- Migration: Update image URLs to use local images from NAS
-- This script updates all pokemon_master.image_url to point to local images
-- instead of external GitHub URLs
--
-- Images are stored in: /frontend/public/images/pokemon/{pokemon_id}_{form_name}.png
-- They will be served as: /images/pokemon/{pokemon_id}_{form_name}.png

BEGIN;

-- Update all image URLs to use local path
UPDATE pokemon_master
SET image_url = '/images/pokemon/' || pokemon_id || '_' || form_name || '.png'
WHERE is_available = true;

-- Verify the update
SELECT 
    pokemon_id, 
    form_name, 
    name_fr, 
    image_url 
FROM pokemon_master 
WHERE is_available = true 
ORDER BY pokemon_id ASC, form_name ASC
LIMIT 10;

COMMIT;

-- To rollback to GitHub URLs if needed:
-- BEGIN;
-- UPDATE pokemon_master
-- SET image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/' || pokemon_id || '.png'
-- WHERE form_name = 'Normal';
-- 
-- UPDATE pokemon_master
-- SET image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/' || pokemon_id || '.png'
-- WHERE form_name != 'Normal';
-- COMMIT;
