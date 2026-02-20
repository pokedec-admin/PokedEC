-- Migration: Normalize image URLs to remove accents and special characters
-- This ensures consistency between database URLs and actual filenames

-- Function to normalize form names (remove accents, keep only safe chars)
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

-- Update all image URLs to use normalized form names
UPDATE pokemon_master
SET image_url = '/images/pokemon/' || pokemon_id || '_' || normalize_form_name(form_name) || 
    CASE 
        WHEN image_url ~ '\.(png|jpg|jpeg|gif|webp)(\?.*)?$' 
        THEN regexp_replace(image_url, '^.*(\.(png|jpg|jpeg|gif|webp))(\?.*)?$', '\1')
        ELSE '.png'
    END
WHERE image_url LIKE '/images/pokemon/%'
  AND form_name != 'Normal';  -- Don't update Normal forms as they're already correct

-- Also update Normal forms to ensure consistency
UPDATE pokemon_master
SET image_url = '/images/pokemon/' || pokemon_id || '_Normal.png'
WHERE form_name = 'Normal'
  AND (image_url IS NULL OR image_url NOT LIKE '/images/pokemon/%');

-- Verify the changes
SELECT pokemon_id, form_name, image_url 
FROM pokemon_master 
WHERE pokemon_id IN (6, 150) 
ORDER BY pokemon_id, form_name;
