-- MIGRATION DES DONNÉES MAÎTRES DES FORMES

-- Data for raichu-alola (Alola)
UPDATE pokemon_master SET 
  type_primary_id = 5, 
  type_secondary_id = 13, 
  image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10100.png', 
  region_id = 7, 
  name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 26 AND form_name = 'Normal') || ' (' || 'Alolan Raichu' || ')', 
  name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 26 AND form_name = 'Normal') || ' (' || 'Alola Raichu' || ')', 
  name_it = (SELECT name_it FROM pokemon_master WHERE pokemon_id = 26 AND form_name = 'Normal') || ' (' || 'Alola' || ')'
WHERE pokemon_id = 26 AND form_name = 'Alola';

-- Data for ninetales-alola (Alola)
UPDATE pokemon_master SET 
  type_primary_id = 8, 
  type_secondary_id = 6, 
  image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10104.png', 
  region_id = 7, 
  name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 38 AND form_name = 'Normal') || ' (' || 'Alolan Ninetales' || ')', 
  name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 38 AND form_name = 'Normal') || ' (' || 'Alola Vulnona' || ')', 
  name_it = (SELECT name_it FROM pokemon_master WHERE pokemon_id = 38 AND form_name = 'Normal') || ' (' || 'Alola' || ')'
WHERE pokemon_id = 38 AND form_name = 'Alola';

-- Data for vulpix-alola (Alola)
UPDATE pokemon_master SET 
  type_primary_id = 8, 
  type_secondary_id = NULL, 
  image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10103.png', 
  region_id = 7, 
  name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 37 AND form_name = 'Normal') || ' (' || 'Alolan Vulpix' || ')', 
  name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 37 AND form_name = 'Normal') || ' (' || 'Alola Vulpix' || ')', 
  name_it = (SELECT name_it FROM pokemon_master WHERE pokemon_id = 37 AND form_name = 'Normal') || ' (' || 'Alola' || ')'
WHERE pokemon_id = 37 AND form_name = 'Alola';

-- Data for rattata-alola (Alola)
UPDATE pokemon_master SET 
  type_primary_id = 17, 
  type_secondary_id = 10, 
  image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10091.png', 
  region_id = 7, 
  name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 19 AND form_name = 'Normal') || ' (' || 'Alolan Rattata' || ')', 
  name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 19 AND form_name = 'Normal') || ' (' || 'Alola Rattfratz' || ')', 
  name_it = (SELECT name_it FROM pokemon_master WHERE pokemon_id = 19 AND form_name = 'Normal') || ' (' || 'Alola' || ')'
WHERE pokemon_id = 19 AND form_name = 'Alola';

-- Data for sandshrew-alola (Alola)
UPDATE pokemon_master SET 
  type_primary_id = 8, 
  type_secondary_id = 1, 
  image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10101.png', 
  region_id = 7, 
  name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 27 AND form_name = 'Normal') || ' (' || 'Alolan Sandshrew' || ')', 
  name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 27 AND form_name = 'Normal') || ' (' || 'Alola Sandan' || ')', 
  name_it = (SELECT name_it FROM pokemon_master WHERE pokemon_id = 27 AND form_name = 'Normal') || ' (' || 'Alola' || ')'
WHERE pokemon_id = 27 AND form_name = 'Alola';

-- Data for diglett-alola (Alola)
UPDATE pokemon_master SET 
  type_primary_id = 15, 
  type_secondary_id = 1, 
  image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10105.png', 
  region_id = 7, 
  name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 50 AND form_name = 'Normal') || ' (' || 'Alolan Diglett' || ')', 
  name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 50 AND form_name = 'Normal') || ' (' || 'Alola Digda' || ')', 
  name_it = (SELECT name_it FROM pokemon_master WHERE pokemon_id = 50 AND form_name = 'Normal') || ' (' || 'Alola' || ')'
WHERE pokemon_id = 50 AND form_name = 'Alola';

-- Data for meowth-alola (Alola)
UPDATE pokemon_master SET 
  type_primary_id = 17, 
  type_secondary_id = NULL, 
  image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10107.png', 
  region_id = 7, 
  name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 52 AND form_name = 'Normal') || ' (' || 'Alolan Meowth' || ')', 
  name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 52 AND form_name = 'Normal') || ' (' || 'Alola Mauzi' || ')', 
  name_it = (SELECT name_it FROM pokemon_master WHERE pokemon_id = 52 AND form_name = 'Normal') || ' (' || 'Alola' || ')'
WHERE pokemon_id = 52 AND form_name = 'Alola';

-- Data for meowth-galar (Galar)
UPDATE pokemon_master SET 
  type_primary_id = 1, 
  type_secondary_id = NULL, 
  image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10161.png', 
  region_id = 8, 
  name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 52 AND form_name = 'Normal') || ' (' || 'Galarian Meowth' || ')', 
  name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 52 AND form_name = 'Normal') || ' (' || 'Galar Mauzi' || ')', 
  name_it = (SELECT name_it FROM pokemon_master WHERE pokemon_id = 52 AND form_name = 'Normal') || ' (' || 'Galar' || ')'
WHERE pokemon_id = 52 AND form_name = 'Galar';

-- Data for geodude-alola (Alola)
UPDATE pokemon_master SET 
  type_primary_id = 14, 
  type_secondary_id = 5, 
  image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10109.png', 
  region_id = 7, 
  name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 74 AND form_name = 'Normal') || ' (' || 'Alolan Geodude' || ')', 
  name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 74 AND form_name = 'Normal') || ' (' || 'Alola Kleinstein' || ')', 
  name_it = (SELECT name_it FROM pokemon_master WHERE pokemon_id = 74 AND form_name = 'Normal') || ' (' || 'Alola' || ')'
WHERE pokemon_id = 74 AND form_name = 'Alola';

-- Data for grimer-alola (Alola)
UPDATE pokemon_master SET 
  type_primary_id = 12, 
  type_secondary_id = 17, 
  image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10112.png', 
  region_id = 7, 
  name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 88 AND form_name = 'Normal') || ' (' || 'Alolan Grimer' || ')', 
  name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 88 AND form_name = 'Normal') || ' (' || 'Alola Sleima' || ')', 
  name_it = (SELECT name_it FROM pokemon_master WHERE pokemon_id = 88 AND form_name = 'Normal') || ' (' || 'Alola' || ')'
WHERE pokemon_id = 88 AND form_name = 'Alola';

-- Data for exeggutor-alola (Alola)
UPDATE pokemon_master SET 
  type_primary_id = 11, 
  type_secondary_id = 3, 
  image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10114.png', 
  region_id = 7, 
  name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 103 AND form_name = 'Normal') || ' (' || 'Alolan Exeggutor' || ')', 
  name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 103 AND form_name = 'Normal') || ' (' || 'Alola Kokowei' || ')', 
  name_it = (SELECT name_it FROM pokemon_master WHERE pokemon_id = 103 AND form_name = 'Normal') || ' (' || 'Alola' || ')'
WHERE pokemon_id = 103 AND form_name = 'Alola';

-- Data for marowak-alola (Alola)
UPDATE pokemon_master SET 
  type_primary_id = 7, 
  type_secondary_id = 16, 
  image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10115.png', 
  region_id = 7, 
  name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 105 AND form_name = 'Normal') || ' (' || 'Alolan Marowak' || ')', 
  name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 105 AND form_name = 'Normal') || ' (' || 'Alola Knogga' || ')', 
  name_it = (SELECT name_it FROM pokemon_master WHERE pokemon_id = 105 AND form_name = 'Normal') || ' (' || 'Alola' || ')'
WHERE pokemon_id = 105 AND form_name = 'Alola';

-- Data for ponyta-galar (Galar)
UPDATE pokemon_master SET 
  type_primary_id = 13, 
  type_secondary_id = NULL, 
  image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10162.png', 
  region_id = 8, 
  name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 77 AND form_name = 'Normal') || ' (' || 'Galarian Ponyta' || ')', 
  name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 77 AND form_name = 'Normal') || ' (' || 'Galar Ponita' || ')', 
  name_it = (SELECT name_it FROM pokemon_master WHERE pokemon_id = 77 AND form_name = 'Normal') || ' (' || 'Galar' || ')'
WHERE pokemon_id = 77 AND form_name = 'Galar';

-- Data for slowpoke-galar (Galar)
UPDATE pokemon_master SET 
  type_primary_id = 13, 
  type_secondary_id = NULL, 
  image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10164.png', 
  region_id = 8, 
  name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 79 AND form_name = 'Normal') || ' (' || 'Galarian Slowpoke' || ')', 
  name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 79 AND form_name = 'Normal') || ' (' || 'Galar Flegmon' || ')', 
  name_it = (SELECT name_it FROM pokemon_master WHERE pokemon_id = 79 AND form_name = 'Normal') || ' (' || 'Galar' || ')'
WHERE pokemon_id = 79 AND form_name = 'Galar';

-- Data for farfetchd-galar (Galar)
UPDATE pokemon_master SET 
  type_primary_id = 2, 
  type_secondary_id = NULL, 
  image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10166.png', 
  region_id = 8, 
  name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 83 AND form_name = 'Normal') || ' (' || 'Galarian Farfetch’d' || ')', 
  name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 83 AND form_name = 'Normal') || ' (' || 'Galar Porenta' || ')', 
  name_it = (SELECT name_it FROM pokemon_master WHERE pokemon_id = 83 AND form_name = 'Normal') || ' (' || 'Galar' || ')'
WHERE pokemon_id = 83 AND form_name = 'Galar';

-- Data for weezing-galar (Galar)
UPDATE pokemon_master SET 
  type_primary_id = 12, 
  type_secondary_id = 6, 
  image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10167.png', 
  region_id = 8, 
  name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 110 AND form_name = 'Normal') || ' (' || 'Galarian Weezing' || ')', 
  name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 110 AND form_name = 'Normal') || ' (' || 'Galar Smogmog' || ')', 
  name_it = (SELECT name_it FROM pokemon_master WHERE pokemon_id = 110 AND form_name = 'Normal') || ' (' || 'Galar' || ')'
WHERE pokemon_id = 110 AND form_name = 'Galar';

-- Data for mr-mime-galar (Galar)
UPDATE pokemon_master SET 
  type_primary_id = 8, 
  type_secondary_id = 13, 
  image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10168.png', 
  region_id = 8, 
  name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 122 AND form_name = 'Normal') || ' (' || 'Galarian Mr. Mime' || ')', 
  name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 122 AND form_name = 'Normal') || ' (' || 'Galar Pantimos' || ')', 
  name_it = (SELECT name_it FROM pokemon_master WHERE pokemon_id = 122 AND form_name = 'Normal') || ' (' || 'Galar' || ')'
WHERE pokemon_id = 122 AND form_name = 'Galar';

-- Data for articuno-galar (Galar)
UPDATE pokemon_master SET 
  type_primary_id = 13, 
  type_secondary_id = 18, 
  image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10169.png', 
  region_id = 8, 
  name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 144 AND form_name = 'Normal') || ' (' || 'Galarian Articuno' || ')', 
  name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 144 AND form_name = 'Normal') || ' (' || 'Galar Arktos' || ')', 
  name_it = (SELECT name_it FROM pokemon_master WHERE pokemon_id = 144 AND form_name = 'Normal') || ' (' || 'Galar' || ')'
WHERE pokemon_id = 144 AND form_name = 'Galar';

-- Data for zapdos-galar (Galar)
UPDATE pokemon_master SET 
  type_primary_id = 2, 
  type_secondary_id = 18, 
  image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10170.png', 
  region_id = 8, 
  name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 145 AND form_name = 'Normal') || ' (' || 'Galarian Zapdos' || ')', 
  name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 145 AND form_name = 'Normal') || ' (' || 'Galar Zapdos' || ')', 
  name_it = (SELECT name_it FROM pokemon_master WHERE pokemon_id = 145 AND form_name = 'Normal') || ' (' || 'Galar' || ')'
WHERE pokemon_id = 145 AND form_name = 'Galar';

-- Data for moltres-galar (Galar)
UPDATE pokemon_master SET 
  type_primary_id = 17, 
  type_secondary_id = 18, 
  image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10171.png', 
  region_id = 8, 
  name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 146 AND form_name = 'Normal') || ' (' || 'Galarian Moltres' || ')', 
  name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 146 AND form_name = 'Normal') || ' (' || 'Galar Lavados' || ')', 
  name_it = (SELECT name_it FROM pokemon_master WHERE pokemon_id = 146 AND form_name = 'Normal') || ' (' || 'Galar' || ')'
WHERE pokemon_id = 146 AND form_name = 'Galar';

-- Data for darumaka-galar (Galar)
UPDATE pokemon_master SET 
  type_primary_id = 8, 
  type_secondary_id = NULL, 
  image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10176.png', 
  region_id = 8, 
  name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 554 AND form_name = 'Normal') || ' (' || 'Galarian Darumaka' || ')', 
  name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 554 AND form_name = 'Normal') || ' (' || 'Galar Flampion' || ')', 
  name_it = (SELECT name_it FROM pokemon_master WHERE pokemon_id = 554 AND form_name = 'Normal') || ' (' || 'Galar' || ')'
WHERE pokemon_id = 554 AND form_name = 'Galar';

-- Data for stunfisk-galar (Galar)
UPDATE pokemon_master SET 
  type_primary_id = 15, 
  type_secondary_id = 1, 
  image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10180.png', 
  region_id = 8, 
  name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 618 AND form_name = 'Normal') || ' (' || 'Galarian Stunfisk' || ')', 
  name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 618 AND form_name = 'Normal') || ' (' || 'Galar Flunschlik' || ')', 
  name_it = (SELECT name_it FROM pokemon_master WHERE pokemon_id = 618 AND form_name = 'Normal') || ' (' || 'Galar' || ')'
WHERE pokemon_id = 618 AND form_name = 'Galar';

-- Data for growlithe-hisui (Hisui)
UPDATE pokemon_master SET 
  type_primary_id = 7, 
  type_secondary_id = 14, 
  image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10229.png', 
  region_id = 9, 
  name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 58 AND form_name = 'Normal') || ' (' || 'Hisuian Growlithe' || ')', 
  name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 58 AND form_name = 'Normal') || ' (' || 'Hisui Fukano' || ')', 
  name_it = (SELECT name_it FROM pokemon_master WHERE pokemon_id = 58 AND form_name = 'Normal') || ' (' || 'Hisui' || ')'
WHERE pokemon_id = 58 AND form_name = 'Hisui';

-- Data for voltorb-hisui (Hisui)
UPDATE pokemon_master SET 
  type_primary_id = 5, 
  type_secondary_id = 11, 
  image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10231.png', 
  region_id = 9, 
  name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 100 AND form_name = 'Normal') || ' (' || 'Hisuian Voltorb' || ')', 
  name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 100 AND form_name = 'Normal') || ' (' || 'Hisui Voltobal' || ')', 
  name_it = (SELECT name_it FROM pokemon_master WHERE pokemon_id = 100 AND form_name = 'Normal') || ' (' || 'Hisui' || ')'
WHERE pokemon_id = 100 AND form_name = 'Hisui';

-- Data for typhlosion-hisui (Hisui)
UPDATE pokemon_master SET 
  type_primary_id = 7, 
  type_secondary_id = 16, 
  image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10233.png', 
  region_id = 9, 
  name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 157 AND form_name = 'Normal') || ' (' || 'Hisuian Typhlosion' || ')', 
  name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 157 AND form_name = 'Normal') || ' (' || 'Hisui Tornupto' || ')', 
  name_it = (SELECT name_it FROM pokemon_master WHERE pokemon_id = 157 AND form_name = 'Normal') || ' (' || 'Hisui' || ')'
WHERE pokemon_id = 157 AND form_name = 'Hisui';

-- Data for qwilfish-hisui (Hisui)
UPDATE pokemon_master SET 
  type_primary_id = 17, 
  type_secondary_id = 12, 
  image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10234.png', 
  region_id = 9, 
  name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 211 AND form_name = 'Normal') || ' (' || 'Hisuian Qwilfish' || ')', 
  name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 211 AND form_name = 'Normal') || ' (' || 'Hisui Baldorfish' || ')', 
  name_it = (SELECT name_it FROM pokemon_master WHERE pokemon_id = 211 AND form_name = 'Normal') || ' (' || 'Hisui' || ')'
WHERE pokemon_id = 211 AND form_name = 'Hisui';

-- Data for samurott-hisui (Hisui)
UPDATE pokemon_master SET 
  type_primary_id = 4, 
  type_secondary_id = 17, 
  image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10236.png', 
  region_id = 9, 
  name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 503 AND form_name = 'Normal') || ' (' || 'Hisuian Samurott' || ')', 
  name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 503 AND form_name = 'Normal') || ' (' || 'Hisui Admurai' || ')', 
  name_it = (SELECT name_it FROM pokemon_master WHERE pokemon_id = 503 AND form_name = 'Normal') || ' (' || 'Hisui' || ')'
WHERE pokemon_id = 503 AND form_name = 'Hisui';

-- Data for zorua-hisui (Hisui)
UPDATE pokemon_master SET 
  type_primary_id = 10, 
  type_secondary_id = 16, 
  image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10238.png', 
  region_id = 9, 
  name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 570 AND form_name = 'Normal') || ' (' || 'Hisuian Zorua' || ')', 
  name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 570 AND form_name = 'Normal') || ' (' || 'Hisui Zorua' || ')', 
  name_it = (SELECT name_it FROM pokemon_master WHERE pokemon_id = 570 AND form_name = 'Normal') || ' (' || 'Hisui' || ')'
WHERE pokemon_id = 570 AND form_name = 'Hisui';

-- Data for sliggoo-hisui (Hisui)
UPDATE pokemon_master SET 
  type_primary_id = 1, 
  type_secondary_id = 3, 
  image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10241.png', 
  region_id = 9, 
  name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 705 AND form_name = 'Normal') || ' (' || 'Hisuian Sliggoo' || ')', 
  name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 705 AND form_name = 'Normal') || ' (' || 'Hisui Viscargot' || ')', 
  name_it = (SELECT name_it FROM pokemon_master WHERE pokemon_id = 705 AND form_name = 'Normal') || ' (' || 'Hisui' || ')'
WHERE pokemon_id = 705 AND form_name = 'Hisui';

-- Data for avalugg-hisui (Hisui)
UPDATE pokemon_master SET 
  type_primary_id = 8, 
  type_secondary_id = 14, 
  image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10243.png', 
  region_id = 9, 
  name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 713 AND form_name = 'Normal') || ' (' || 'Hisuian Avalugg' || ')', 
  name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 713 AND form_name = 'Normal') || ' (' || 'Hisui Arktilas' || ')', 
  name_it = (SELECT name_it FROM pokemon_master WHERE pokemon_id = 713 AND form_name = 'Normal') || ' (' || 'Hisui' || ')'
WHERE pokemon_id = 713 AND form_name = 'Hisui';

-- Data for decidueye-hisui (Hisui)
UPDATE pokemon_master SET 
  type_primary_id = 11, 
  type_secondary_id = 2, 
  image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10244.png', 
  region_id = 9, 
  name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 724 AND form_name = 'Normal') || ' (' || 'Hisuian Decidueye' || ')', 
  name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 724 AND form_name = 'Normal') || ' (' || 'Hisui Silvarro' || ')', 
  name_it = (SELECT name_it FROM pokemon_master WHERE pokemon_id = 724 AND form_name = 'Normal') || ' (' || 'Hisui' || ')'
WHERE pokemon_id = 724 AND form_name = 'Hisui';

-- Data for wooper-paldea (Paldea)
UPDATE pokemon_master SET 
  type_primary_id = 12, 
  type_secondary_id = 15, 
  image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10253.png', 
  region_id = 10, 
  name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 194 AND form_name = 'Normal') || ' (' || 'Paldean Wooper' || ')', 
  name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 194 AND form_name = 'Normal') || ' (' || 'Paldea' || ')', 
  name_it = (SELECT name_it FROM pokemon_master WHERE pokemon_id = 194 AND form_name = 'Normal') || ' (' || 'Paldea' || ')'
WHERE pokemon_id = 194 AND form_name = 'Paldea';

-- Data for kyurem-black (Noir)
UPDATE pokemon_master SET 
  type_primary_id = 3, 
  type_secondary_id = 8, 
  image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10022.png', 
  name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 646 AND form_name = 'Normal') || ' (' || 'Black Kyurem' || ')', 
  name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 646 AND form_name = 'Normal') || ' (' || 'Schwarzes Kyurem' || ')', 
  name_it = (SELECT name_it FROM pokemon_master WHERE pokemon_id = 646 AND form_name = 'Normal') || ' (' || 'Noir' || ')'
WHERE pokemon_id = 646 AND form_name = 'Noir';

-- Data for kyurem-white (Blanc)
UPDATE pokemon_master SET 
  type_primary_id = 3, 
  type_secondary_id = 8, 
  image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10023.png', 
  name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 646 AND form_name = 'Normal') || ' (' || 'White Kyurem' || ')', 
  name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 646 AND form_name = 'Normal') || ' (' || 'Weißes Kyurem' || ')', 
  name_it = (SELECT name_it FROM pokemon_master WHERE pokemon_id = 646 AND form_name = 'Normal') || ' (' || 'Blanc' || ')'
WHERE pokemon_id = 646 AND form_name = 'Blanc';

-- Data for necrozma-dusk (Crinière du Couchant)
UPDATE pokemon_master SET 
  type_primary_id = 13, 
  type_secondary_id = 1, 
  image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10155.png', 
  name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 800 AND form_name = 'Normal') || ' (' || 'Dusk Necrozma' || ')', 
  name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 800 AND form_name = 'Normal') || ' (' || 'Necrozma (Abendmähne)' || ')', 
  name_it = (SELECT name_it FROM pokemon_master WHERE pokemon_id = 800 AND form_name = 'Normal') || ' (' || 'Crinière du Couchant' || ')'
WHERE pokemon_id = 800 AND form_name = 'Crinière du Couchant';

-- Data for necrozma-dawn (Ailes de l'Aurore)
UPDATE pokemon_master SET 
  type_primary_id = 13, 
  type_secondary_id = 16, 
  image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10156.png', 
  name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 800 AND form_name = 'Normal') || ' (' || 'Dawn Necrozma' || ')', 
  name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 800 AND form_name = 'Normal') || ' (' || 'Necrozma (Morgenschwingen)' || ')', 
  name_it = (SELECT name_it FROM pokemon_master WHERE pokemon_id = 800 AND form_name = 'Normal') || ' (' || 'Ailes de l''Aurore' || ')'
WHERE pokemon_id = 800 AND form_name = 'Ailes de l''Aurore';

-- Data for zacian-crowned (Épée Suprême)
UPDATE pokemon_master SET 
  type_primary_id = 6, 
  type_secondary_id = 1, 
  image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10188.png', 
  name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 888 AND form_name = 'Normal') || ' (' || 'Crowned Zacian' || ')', 
  name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 888 AND form_name = 'Normal') || ' (' || 'König Zacian' || ')', 
  name_it = (SELECT name_it FROM pokemon_master WHERE pokemon_id = 888 AND form_name = 'Normal') || ' (' || 'Épée Suprême' || ')'
WHERE pokemon_id = 888 AND form_name = 'Épée Suprême';

-- Data for zamazenta-crowned (Bouclier Suprême)
UPDATE pokemon_master SET 
  type_primary_id = 2, 
  type_secondary_id = 1, 
  image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10189.png', 
  name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 889 AND form_name = 'Normal') || ' (' || 'Crowned Zamazenta' || ')', 
  name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 889 AND form_name = 'Normal') || ' (' || 'König Zamazenta' || ')', 
  name_it = (SELECT name_it FROM pokemon_master WHERE pokemon_id = 889 AND form_name = 'Normal') || ' (' || 'Bouclier Suprême' || ')'
WHERE pokemon_id = 889 AND form_name = 'Bouclier Suprême';

-- Data for calyrex-ice (Cavalier du Froid)
UPDATE pokemon_master SET 
  type_primary_id = 13, 
  type_secondary_id = 8, 
  image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10193.png', 
  name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 898 AND form_name = 'Normal') || ' (' || 'Ice Calyrex' || ')', 
  name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 898 AND form_name = 'Normal') || ' (' || 'Coronospa (Schimmelreiter)' || ')', 
  name_it = (SELECT name_it FROM pokemon_master WHERE pokemon_id = 898 AND form_name = 'Normal') || ' (' || 'Cavalier du Froid' || ')'
WHERE pokemon_id = 898 AND form_name = 'Cavalier du Froid';

-- Data for calyrex-shadow (Cavalier d'Effroi)
UPDATE pokemon_master SET 
  type_primary_id = 13, 
  type_secondary_id = 16, 
  image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10194.png', 
  name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 898 AND form_name = 'Normal') || ' (' || 'Shadow Calyrex' || ')', 
  name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 898 AND form_name = 'Normal') || ' (' || 'Coronospa (Rappenreiter)' || ')', 
  name_it = (SELECT name_it FROM pokemon_master WHERE pokemon_id = 898 AND form_name = 'Normal') || ' (' || 'Cavalier d''Effroi' || ')'
WHERE pokemon_id = 898 AND form_name = 'Cavalier d''Effroi';

-- Data for oricorio-pom-pom (Pom-Pom)
UPDATE pokemon_master SET 
  type_primary_id = 5, 
  type_secondary_id = 18, 
  image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10123.png', 
  name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 741 AND form_name = 'Normal') || ' (' || 'Pom-pom Oricorio' || ')', 
  name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 741 AND form_name = 'Normal') || ' (' || 'Choreogel (Cheerleading)' || ')', 
  name_it = (SELECT name_it FROM pokemon_master WHERE pokemon_id = 741 AND form_name = 'Normal') || ' (' || 'Pom-Pom' || ')'
WHERE pokemon_id = 741 AND form_name = 'Pom-Pom';

-- Data for oricorio-pau (Hula)
UPDATE pokemon_master SET 
  type_primary_id = 13, 
  type_secondary_id = 18, 
  image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10124.png', 
  name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 741 AND form_name = 'Normal') || ' (' || 'Pa’u Oricorio' || ')', 
  name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 741 AND form_name = 'Normal') || ' (' || 'Choreogel (Hula)' || ')', 
  name_it = (SELECT name_it FROM pokemon_master WHERE pokemon_id = 741 AND form_name = 'Normal') || ' (' || 'Hula' || ')'
WHERE pokemon_id = 741 AND form_name = 'Hula';

-- Data for oricorio-sensu (Buyō)
UPDATE pokemon_master SET 
  type_primary_id = 16, 
  type_secondary_id = 18, 
  image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10125.png', 
  name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 741 AND form_name = 'Normal') || ' (' || 'Sensu Oricorio' || ')', 
  name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 741 AND form_name = 'Normal') || ' (' || 'Choreogel (Buyo)' || ')', 
  name_it = (SELECT name_it FROM pokemon_master WHERE pokemon_id = 741 AND form_name = 'Normal') || ' (' || 'Buyō' || ')'
WHERE pokemon_id = 741 AND form_name = 'Buyō';

