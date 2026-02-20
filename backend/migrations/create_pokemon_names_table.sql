CREATE TABLE IF NOT EXISTS pokemon_names (
    pokemon_id INTEGER PRIMARY KEY,
    name_fr VARCHAR(255),
    name_en VARCHAR(255),
    name_de VARCHAR(255),
    name_it VARCHAR(255),
    name_pt VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_pokemon_names_id ON pokemon_names(pokemon_id);
