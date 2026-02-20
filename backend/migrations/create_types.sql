-- Create Types Reference Table
CREATE TABLE IF NOT EXISTS types (
    id SERIAL PRIMARY KEY,
    name_key VARCHAR(50) UNIQUE NOT NULL,
    name_fr VARCHAR(50) NOT NULL,
    name_en VARCHAR(50) NOT NULL,
    color_hex VARCHAR(7)
);

-- Seed Types (18 Pokemon types)
INSERT INTO types (name_key, name_fr, name_en, color_hex) VALUES
('steel', 'Acier', 'Steel', '#B7B7CE'),
('fighting', 'Combat', 'Fighting', '#D56723'),
('dragon', 'Dragon', 'Dragon', '#6F35FC'),
('water', 'Eau', 'Water', '#4592C4'),
('electric', 'Électrik', 'Electric', '#EED535'),
('fairy', 'Fée', 'Fairy', '#FDB9E9'),
('fire', 'Feu', 'Fire', '#FD7D24'),
('ice', 'Glace', 'Ice', '#51C4E7'),
('bug', 'Insecte', 'Bug', '#729F3F'),
('normal', 'Normal', 'Normal', '#A4ACAF'),
('grass', 'Plante', 'Grass', '#9BCC50'),
('poison', 'Poison', 'Poison', '#B97FC9'),
('psychic', 'Psy', 'Psychic', '#F366B9'),
('rock', 'Roche', 'Rock', '#A38C21'),
('ground', 'Sol', 'Ground', '#AB9842'),
('ghost', 'Spectre', 'Ghost', '#7B62A3'),
('dark', 'Ténèbres', 'Dark', '#707070'),
('flying', 'Vol', 'Flying', '#3DC7EF')
ON CONFLICT (name_key) DO NOTHING;
