-- Create Regions Reference Table
CREATE TABLE IF NOT EXISTS regions (
    id SERIAL PRIMARY KEY,
    name_key VARCHAR(50) UNIQUE NOT NULL,
    name_fr VARCHAR(50) NOT NULL,
    name_en VARCHAR(50) NOT NULL,
    display_order INTEGER NOT NULL,
    is_custom BOOLEAN DEFAULT FALSE
);

-- Seed Regions
INSERT INTO regions (name_key, name_fr, name_en, display_order, is_custom) VALUES
('kanto', 'Kanto', 'Kanto', 1, false),
('johto', 'Johto', 'Johto', 2, false),
('hoenn', 'Hoenn', 'Hoenn', 3, false),
('sinnoh', 'Sinnoh', 'Sinnoh', 4, false),
('unova', 'Unova', 'Unova', 5, false),
('kalos', 'Kalos', 'Kalos', 6, false),
('alola', 'Alola', 'Alola', 7, false),
('galar', 'Galar', 'Galar', 8, false),
('hisui', 'Hisui', 'Hisui', 9, false),
('paldea', 'Paldea', 'Paldea', 10, false),
('unknown', 'Inconnue', 'Unknown', 11, false)
ON CONFLICT (name_key) DO NOTHING;
