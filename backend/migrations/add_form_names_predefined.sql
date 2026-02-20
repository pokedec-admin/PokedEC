-- Create table for predefined form names
CREATE TABLE IF NOT EXISTS form_names_predefined (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    is_predefined BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial predefined names
INSERT INTO form_names_predefined (name) VALUES 
('Méga'), 
('Gigamax'), 
('Dynamax'), 
('Totémique'),
('Alola'),
('Galar'),
('Hisui'),
('Paldea')
ON CONFLICT (name) DO NOTHING;
