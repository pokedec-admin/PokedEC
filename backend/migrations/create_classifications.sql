-- Create Classifications Reference Table
CREATE TABLE IF NOT EXISTS classifications (
    id SERIAL PRIMARY KEY,
    name_key VARCHAR(50) UNIQUE NOT NULL,
    name_fr VARCHAR(50) NOT NULL,
    name_en VARCHAR(50) NOT NULL,
    display_order INTEGER NOT NULL
);

-- Seed Classifications
INSERT INTO classifications (name_key, name_fr, name_en, display_order) VALUES
('normal', 'Normal', 'Normal', 1),
('legendary', 'Légendaire', 'Legendary', 2),
('mythical', 'Fabuleux', 'Mythical', 3),
('ultra_beast', 'Ultra-Chimère', 'Ultra Beast', 4),
('fusion', 'Fusion', 'Fusion', 5)
ON CONFLICT (name_key) DO NOTHING;
