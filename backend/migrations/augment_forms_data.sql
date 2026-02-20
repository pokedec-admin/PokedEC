-- SQL Script to update translations and images
-- Found raichu-alola
UPDATE pokemon_master SET image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10100.png' WHERE pokemon_id = 26 AND form_name = 'Alola';
UPDATE pokemon_master SET name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 26 AND form_name = 'Normal') || ' (Alolan Raichu)' WHERE pokemon_id = 26 AND form_name = 'Alola';
UPDATE pokemon_master SET name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 26 AND form_name = 'Normal') || ' (Alola Raichu)' WHERE pokemon_id = 26 AND form_name = 'Alola';
-- Found ninetales-alola
UPDATE pokemon_master SET image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10104.png' WHERE pokemon_id = 38 AND form_name = 'Alola';
UPDATE pokemon_master SET name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 38 AND form_name = 'Normal') || ' (Alolan Ninetales)' WHERE pokemon_id = 38 AND form_name = 'Alola';
UPDATE pokemon_master SET name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 38 AND form_name = 'Normal') || ' (Alola Vulnona)' WHERE pokemon_id = 38 AND form_name = 'Alola';
-- Could not find pokemon unown-b: Unexpected token 'N', "Not Found" is not valid JSON
-- Could not find pokemon unown-c: Unexpected token 'N', "Not Found" is not valid JSON
-- Could not find pokemon unown-d: Unexpected token 'N', "Not Found" is not valid JSON
-- Could not find pokemon unown-e: Unexpected token 'N', "Not Found" is not valid JSON
-- Could not find pokemon unown-f: Unexpected token 'N', "Not Found" is not valid JSON
-- Could not find pokemon unown-g: Unexpected token 'N', "Not Found" is not valid JSON
-- Could not find pokemon unown-h: Unexpected token 'N', "Not Found" is not valid JSON
-- Could not find pokemon unown-i: Unexpected token 'N', "Not Found" is not valid JSON
-- Could not find pokemon unown-j: Unexpected token 'N', "Not Found" is not valid JSON
-- Could not find pokemon unown-k: Unexpected token 'N', "Not Found" is not valid JSON
-- Could not find pokemon unown-l: Unexpected token 'N', "Not Found" is not valid JSON
-- Could not find pokemon unown-m: Unexpected token 'N', "Not Found" is not valid JSON
-- Could not find pokemon unown-n: Unexpected token 'N', "Not Found" is not valid JSON
-- Could not find pokemon unown-o: Unexpected token 'N', "Not Found" is not valid JSON
-- Could not find pokemon unown-p: Unexpected token 'N', "Not Found" is not valid JSON
-- Could not find pokemon unown-q: Unexpected token 'N', "Not Found" is not valid JSON
-- Could not find pokemon unown-r: Unexpected token 'N', "Not Found" is not valid JSON
-- Could not find pokemon unown-s: Unexpected token 'N', "Not Found" is not valid JSON
-- Could not find pokemon unown-t: Unexpected token 'N', "Not Found" is not valid JSON
-- Could not find pokemon unown-u: Unexpected token 'N', "Not Found" is not valid JSON
-- Could not find pokemon unown-v: Unexpected token 'N', "Not Found" is not valid JSON
-- Could not find pokemon unown-w: Unexpected token 'N', "Not Found" is not valid JSON
-- Could not find pokemon unown-x: Unexpected token 'N', "Not Found" is not valid JSON
-- Could not find pokemon unown-y: Unexpected token 'N', "Not Found" is not valid JSON
-- Could not find pokemon unown-z: Unexpected token 'N', "Not Found" is not valid JSON
-- Could not find pokemon unown-exclamation: Unexpected token 'N', "Not Found" is not valid JSON
-- Could not find pokemon unown-question: Unexpected token 'N', "Not Found" is not valid JSON
-- Found castform-sunny
UPDATE pokemon_master SET image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10013.png' WHERE pokemon_id = 351 AND form_name = 'Solaire';
UPDATE pokemon_master SET name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 351 AND form_name = 'Normal') || ' (Sunny Castform)' WHERE pokemon_id = 351 AND form_name = 'Solaire';
UPDATE pokemon_master SET name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 351 AND form_name = 'Normal') || ' (Formeo (Sonne))' WHERE pokemon_id = 351 AND form_name = 'Solaire';
-- Found castform-rainy
UPDATE pokemon_master SET image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10014.png' WHERE pokemon_id = 351 AND form_name = 'Eau de Pluie';
UPDATE pokemon_master SET name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 351 AND form_name = 'Normal') || ' (Rainy Castform)' WHERE pokemon_id = 351 AND form_name = 'Eau de Pluie';
UPDATE pokemon_master SET name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 351 AND form_name = 'Normal') || ' (Formeo (Regen))' WHERE pokemon_id = 351 AND form_name = 'Eau de Pluie';
-- Could not find pokemon castform-icy-snow: Unexpected token 'N', "Not Found" is not valid JSON
-- Found deoxys-attack
UPDATE pokemon_master SET image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10001.png' WHERE pokemon_id = 386 AND form_name = 'Attaque';
UPDATE pokemon_master SET name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 386 AND form_name = 'Normal') || ' (Attack Deoxys)' WHERE pokemon_id = 386 AND form_name = 'Attaque';
UPDATE pokemon_master SET name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 386 AND form_name = 'Normal') || ' (Deoxys (Angriff))' WHERE pokemon_id = 386 AND form_name = 'Attaque';
-- Found deoxys-defense
UPDATE pokemon_master SET image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10002.png' WHERE pokemon_id = 386 AND form_name = 'Défense';
UPDATE pokemon_master SET name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 386 AND form_name = 'Normal') || ' (Defense Deoxys)' WHERE pokemon_id = 386 AND form_name = 'Défense';
UPDATE pokemon_master SET name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 386 AND form_name = 'Normal') || ' (Deoxys (Verteidigung))' WHERE pokemon_id = 386 AND form_name = 'Défense';
-- Found deoxys-speed
UPDATE pokemon_master SET image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10003.png' WHERE pokemon_id = 386 AND form_name = 'Vitesse';
UPDATE pokemon_master SET name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 386 AND form_name = 'Normal') || ' (Speed Deoxys)' WHERE pokemon_id = 386 AND form_name = 'Vitesse';
UPDATE pokemon_master SET name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 386 AND form_name = 'Normal') || ' (Deoxys (Initiative))' WHERE pokemon_id = 386 AND form_name = 'Vitesse';
-- Found oricorio-pom-pom
UPDATE pokemon_master SET image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10123.png' WHERE pokemon_id = 741 AND form_name = 'Pom-Pom';
UPDATE pokemon_master SET name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 741 AND form_name = 'Normal') || ' (Pom-pom Oricorio)' WHERE pokemon_id = 741 AND form_name = 'Pom-Pom';
UPDATE pokemon_master SET name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 741 AND form_name = 'Normal') || ' (Choreogel (Cheerleading))' WHERE pokemon_id = 741 AND form_name = 'Pom-Pom';
-- Found oricorio-pau
UPDATE pokemon_master SET image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10124.png' WHERE pokemon_id = 741 AND form_name = 'Hula';
UPDATE pokemon_master SET name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 741 AND form_name = 'Normal') || ' (Pa’u Oricorio)' WHERE pokemon_id = 741 AND form_name = 'Hula';
UPDATE pokemon_master SET name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 741 AND form_name = 'Normal') || ' (Choreogel (Hula))' WHERE pokemon_id = 741 AND form_name = 'Hula';
-- Found oricorio-sensu
UPDATE pokemon_master SET image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10125.png' WHERE pokemon_id = 741 AND form_name = 'Buyō';
UPDATE pokemon_master SET name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 741 AND form_name = 'Normal') || ' (Sensu Oricorio)' WHERE pokemon_id = 741 AND form_name = 'Buyō';
UPDATE pokemon_master SET name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 741 AND form_name = 'Normal') || ' (Choreogel (Buyo))' WHERE pokemon_id = 741 AND form_name = 'Buyō';
-- Could not find pokemon burmy-sandstorm: Unexpected token 'N', "Not Found" is not valid JSON
-- Could not find pokemon burmy-trash: Unexpected token 'N', "Not Found" is not valid JSON
-- Could not find pokemon wormadam-sandstorm: Unexpected token 'N', "Not Found" is not valid JSON
-- Found wormadam-trash
UPDATE pokemon_master SET image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10005.png' WHERE pokemon_id = 413 AND form_name = 'Déchet';
UPDATE pokemon_master SET name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 413 AND form_name = 'Normal') || ' (Trash Wormadam)' WHERE pokemon_id = 413 AND form_name = 'Déchet';
UPDATE pokemon_master SET name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 413 AND form_name = 'Normal') || ' (Burmadame (Lumpen))' WHERE pokemon_id = 413 AND form_name = 'Déchet';
-- Could not find pokemon cherrim-sunshine: Unexpected token 'N', "Not Found" is not valid JSON
-- Could not find pokemon shellos-east: Unexpected token 'N', "Not Found" is not valid JSON
-- Could not find pokemon gastrodon-east: Unexpected token 'N', "Not Found" is not valid JSON
-- Found rotom-heat
UPDATE pokemon_master SET image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10008.png' WHERE pokemon_id = 479 AND form_name = 'Chaleur';
UPDATE pokemon_master SET name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 479 AND form_name = 'Normal') || ' (Heat Rotom)' WHERE pokemon_id = 479 AND form_name = 'Chaleur';
UPDATE pokemon_master SET name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 479 AND form_name = 'Normal') || ' (Hitze-Rotom)' WHERE pokemon_id = 479 AND form_name = 'Chaleur';
-- Found rotom-wash
UPDATE pokemon_master SET image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10009.png' WHERE pokemon_id = 479 AND form_name = 'Lavage';
UPDATE pokemon_master SET name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 479 AND form_name = 'Normal') || ' (Wash Rotom)' WHERE pokemon_id = 479 AND form_name = 'Lavage';
UPDATE pokemon_master SET name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 479 AND form_name = 'Normal') || ' (Wasch-Rotom)' WHERE pokemon_id = 479 AND form_name = 'Lavage';
-- Found rotom-frost
UPDATE pokemon_master SET image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10010.png' WHERE pokemon_id = 479 AND form_name = 'Froid';
UPDATE pokemon_master SET name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 479 AND form_name = 'Normal') || ' (Frost Rotom)' WHERE pokemon_id = 479 AND form_name = 'Froid';
UPDATE pokemon_master SET name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 479 AND form_name = 'Normal') || ' (Frost-Rotom)' WHERE pokemon_id = 479 AND form_name = 'Froid';
-- Found rotom-fan
UPDATE pokemon_master SET image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10011.png' WHERE pokemon_id = 479 AND form_name = 'Hélice';
UPDATE pokemon_master SET name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 479 AND form_name = 'Normal') || ' (Fan Rotom)' WHERE pokemon_id = 479 AND form_name = 'Hélice';
UPDATE pokemon_master SET name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 479 AND form_name = 'Normal') || ' (Wirbel-Rotom)' WHERE pokemon_id = 479 AND form_name = 'Hélice';
-- Found rotom-mow
UPDATE pokemon_master SET image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10012.png' WHERE pokemon_id = 479 AND form_name = 'Tonte';
UPDATE pokemon_master SET name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 479 AND form_name = 'Normal') || ' (Mow Rotom)' WHERE pokemon_id = 479 AND form_name = 'Tonte';
UPDATE pokemon_master SET name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 479 AND form_name = 'Normal') || ' (Schneid-Rotom)' WHERE pokemon_id = 479 AND form_name = 'Tonte';
-- Could not find pokemon deerling-summer: Unexpected token 'N', "Not Found" is not valid JSON
-- Could not find pokemon deerling-autumn: Unexpected token 'N', "Not Found" is not valid JSON
-- Could not find pokemon deerling-winter: Unexpected token 'N', "Not Found" is not valid JSON
-- Could not find pokemon sawsbuck-summer: Unexpected token 'N', "Not Found" is not valid JSON
-- Could not find pokemon sawsbuck-autumn: Unexpected token 'N', "Not Found" is not valid JSON
-- Could not find pokemon sawsbuck-winter: Unexpected token 'N', "Not Found" is not valid JSON
-- Could not find pokemon furfrou-heart: Unexpected token 'N', "Not Found" is not valid JSON
-- Could not find pokemon furfrou-star: Unexpected token 'N', "Not Found" is not valid JSON
-- Could not find pokemon furfrou-diamond: Unexpected token 'N', "Not Found" is not valid JSON
-- Could not find pokemon furfrou-debutante: Unexpected token 'N', "Not Found" is not valid JSON
-- Could not find pokemon furfrou-matron: Unexpected token 'N', "Not Found" is not valid JSON
-- Could not find pokemon furfrou-dandy: Unexpected token 'N', "Not Found" is not valid JSON
-- Could not find pokemon furfrou-la-reine: Unexpected token 'N', "Not Found" is not valid JSON
-- Could not find pokemon furfrou-kabuki: Unexpected token 'N', "Not Found" is not valid JSON
-- Could not find pokemon furfrou-pharaoh: Unexpected token 'N', "Not Found" is not valid JSON
-- Could not find pokemon vivillon-archipelago: Unexpected token 'N', "Not Found" is not valid JSON
-- Could not find pokemon vivillon-continental: Unexpected token 'N', "Not Found" is not valid JSON
-- Could not find pokemon vivillon-icy-snow: Unexpected token 'N', "Not Found" is not valid JSON
-- Could not find pokemon vivillon-continental: Unexpected token 'N', "Not Found" is not valid JSON
-- Could not find pokemon vivillon-monsoon: Unexpected token 'N', "Not Found" is not valid JSON
-- Could not find pokemon vivillon-river: Unexpected token 'N', "Not Found" is not valid JSON
-- Could not find pokemon vivillon-fancy: Unexpected token 'N', "Not Found" is not valid JSON
-- Could not find pokemon vivillon-garden: Unexpected token 'N', "Not Found" is not valid JSON
-- Could not find pokemon vivillon-polar: Unexpected token 'N', "Not Found" is not valid JSON
-- Could not find pokemon vivillon-jungle: Unexpected token 'N', "Not Found" is not valid JSON
-- Could not find pokemon vivillon-mangrove: Unexpected token 'N', "Not Found" is not valid JSON
-- Could not find pokemon vivillon-modern: Unexpected token 'N', "Not Found" is not valid JSON
-- Could not find pokemon vivillon-elegant: Unexpected token 'N', "Not Found" is not valid JSON
-- Could not find pokemon vivillon-pokeball: Unexpected token 'N', "Not Found" is not valid JSON
-- Could not find pokemon vivillon-marine: Unexpected token 'N', "Not Found" is not valid JSON
-- Could not find pokemon vivillon-sandstorm: Unexpected token 'N', "Not Found" is not valid JSON
-- Could not find pokemon vivillon-high-plains: Unexpected token 'N', "Not Found" is not valid JSON
-- Could not find pokemon vivillon-sun: Unexpected token 'N', "Not Found" is not valid JSON
-- Could not find pokemon vivillon-meadow: Unexpected token 'N', "Not Found" is not valid JSON
-- Could not find pokemon vivillon-savanna: Unexpected token 'N', "Not Found" is not valid JSON
-- Found pumpkaboo-small
UPDATE pokemon_master SET image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10027.png' WHERE pokemon_id = 710 AND form_name = 'Petit';
UPDATE pokemon_master SET name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 710 AND form_name = 'Normal') || ' (Small Pumpkaboo)' WHERE pokemon_id = 710 AND form_name = 'Petit';
UPDATE pokemon_master SET name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 710 AND form_name = 'Normal') || ' (Irrbis (S))' WHERE pokemon_id = 710 AND form_name = 'Petit';
-- Found pumpkaboo-large
UPDATE pokemon_master SET image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10028.png' WHERE pokemon_id = 710 AND form_name = 'Grand';
UPDATE pokemon_master SET name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 710 AND form_name = 'Normal') || ' (Large Pumpkaboo)' WHERE pokemon_id = 710 AND form_name = 'Grand';
UPDATE pokemon_master SET name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 710 AND form_name = 'Normal') || ' (Irrbis (L))' WHERE pokemon_id = 710 AND form_name = 'Grand';
-- Found pumpkaboo-super
UPDATE pokemon_master SET image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10029.png' WHERE pokemon_id = 710 AND form_name = 'Ultra';
UPDATE pokemon_master SET name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 710 AND form_name = 'Normal') || ' (Super Pumpkaboo)' WHERE pokemon_id = 710 AND form_name = 'Ultra';
UPDATE pokemon_master SET name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 710 AND form_name = 'Normal') || ' (Irrbis (XL))' WHERE pokemon_id = 710 AND form_name = 'Ultra';
-- Found gourgeist-small
UPDATE pokemon_master SET image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10030.png' WHERE pokemon_id = 711 AND form_name = 'Petit';
UPDATE pokemon_master SET name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 711 AND form_name = 'Normal') || ' (Small Gourgeist)' WHERE pokemon_id = 711 AND form_name = 'Petit';
UPDATE pokemon_master SET name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 711 AND form_name = 'Normal') || ' (Pumpdjinn (S))' WHERE pokemon_id = 711 AND form_name = 'Petit';
-- Found gourgeist-large
UPDATE pokemon_master SET image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10031.png' WHERE pokemon_id = 711 AND form_name = 'Grand';
UPDATE pokemon_master SET name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 711 AND form_name = 'Normal') || ' (Large Gourgeist)' WHERE pokemon_id = 711 AND form_name = 'Grand';
UPDATE pokemon_master SET name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 711 AND form_name = 'Normal') || ' (Pumpdjinn (L))' WHERE pokemon_id = 711 AND form_name = 'Grand';
-- Found gourgeist-super
UPDATE pokemon_master SET image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10032.png' WHERE pokemon_id = 711 AND form_name = 'Ultra';
UPDATE pokemon_master SET name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 711 AND form_name = 'Normal') || ' (Super Gourgeist)' WHERE pokemon_id = 711 AND form_name = 'Ultra';
UPDATE pokemon_master SET name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 711 AND form_name = 'Normal') || ' (Pumpdjinn (XL))' WHERE pokemon_id = 711 AND form_name = 'Ultra';
-- Found lycanroc-midnight
UPDATE pokemon_master SET image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10126.png' WHERE pokemon_id = 745 AND form_name = 'Nocturne';
UPDATE pokemon_master SET name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 745 AND form_name = 'Normal') || ' (Midnight Lycanroc)' WHERE pokemon_id = 745 AND form_name = 'Nocturne';
UPDATE pokemon_master SET name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 745 AND form_name = 'Normal') || ' (Wolwerock (Nacht))' WHERE pokemon_id = 745 AND form_name = 'Nocturne';
-- Found lycanroc-dusk
UPDATE pokemon_master SET image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10152.png' WHERE pokemon_id = 745 AND form_name = 'Crépusculaire';
UPDATE pokemon_master SET name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 745 AND form_name = 'Normal') || ' (Dusk Lycanroc)' WHERE pokemon_id = 745 AND form_name = 'Crépusculaire';
UPDATE pokemon_master SET name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 745 AND form_name = 'Normal') || ' (Wolwerock (Zwielicht))' WHERE pokemon_id = 745 AND form_name = 'Crépusculaire';
-- Could not find pokemon flabebe-yellow: Unexpected token 'N', "Not Found" is not valid JSON
-- Could not find pokemon flabebe-orange: Unexpected token 'N', "Not Found" is not valid JSON
-- Could not find pokemon flabebe-blue: Unexpected token 'N', "Not Found" is not valid JSON
-- Could not find pokemon flabebe-white: Unexpected token 'N', "Not Found" is not valid JSON
-- Found kyurem-black
UPDATE pokemon_master SET image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10022.png' WHERE pokemon_id = 646 AND form_name = 'Noir';
UPDATE pokemon_master SET name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 646 AND form_name = 'Normal') || ' (Black Kyurem)' WHERE pokemon_id = 646 AND form_name = 'Noir';
UPDATE pokemon_master SET name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 646 AND form_name = 'Normal') || ' (Schwarzes Kyurem)' WHERE pokemon_id = 646 AND form_name = 'Noir';
-- Found kyurem-white
UPDATE pokemon_master SET image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10023.png' WHERE pokemon_id = 646 AND form_name = 'Blanc';
UPDATE pokemon_master SET name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 646 AND form_name = 'Normal') || ' (White Kyurem)' WHERE pokemon_id = 646 AND form_name = 'Blanc';
UPDATE pokemon_master SET name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 646 AND form_name = 'Normal') || ' (Weißes Kyurem)' WHERE pokemon_id = 646 AND form_name = 'Blanc';
-- Found necrozma-dusk
UPDATE pokemon_master SET image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10155.png' WHERE pokemon_id = 800 AND form_name = 'Crinière du Couchant';
UPDATE pokemon_master SET name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 800 AND form_name = 'Normal') || ' (Dusk Necrozma)' WHERE pokemon_id = 800 AND form_name = 'Crinière du Couchant';
UPDATE pokemon_master SET name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 800 AND form_name = 'Normal') || ' (Necrozma (Abendmähne))' WHERE pokemon_id = 800 AND form_name = 'Crinière du Couchant';
-- Found necrozma-dawn
UPDATE pokemon_master SET image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10156.png' WHERE pokemon_id = 800 AND form_name = 'Ailes de l'Aurore';
UPDATE pokemon_master SET name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 800 AND form_name = 'Normal') || ' (Dawn Necrozma)' WHERE pokemon_id = 800 AND form_name = 'Ailes de l'Aurore';
UPDATE pokemon_master SET name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 800 AND form_name = 'Normal') || ' (Necrozma (Morgenschwingen))' WHERE pokemon_id = 800 AND form_name = 'Ailes de l'Aurore';
-- Could not find pokemon necrozma-super: Unexpected token 'N', "Not Found" is not valid JSON
-- Found zacian-crowned
UPDATE pokemon_master SET image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10188.png' WHERE pokemon_id = 888 AND form_name = 'Épée Suprême';
UPDATE pokemon_master SET name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 888 AND form_name = 'Normal') || ' (Crowned Zacian)' WHERE pokemon_id = 888 AND form_name = 'Épée Suprême';
UPDATE pokemon_master SET name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 888 AND form_name = 'Normal') || ' (König Zacian)' WHERE pokemon_id = 888 AND form_name = 'Épée Suprême';
-- Found zamazenta-crowned
UPDATE pokemon_master SET image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10189.png' WHERE pokemon_id = 889 AND form_name = 'Bouclier Suprême';
UPDATE pokemon_master SET name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 889 AND form_name = 'Normal') || ' (Crowned Zamazenta)' WHERE pokemon_id = 889 AND form_name = 'Bouclier Suprême';
UPDATE pokemon_master SET name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 889 AND form_name = 'Normal') || ' (König Zamazenta)' WHERE pokemon_id = 889 AND form_name = 'Bouclier Suprême';
-- Found calyrex-ice
UPDATE pokemon_master SET image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10193.png' WHERE pokemon_id = 898 AND form_name = 'Cavalier du Froid';
UPDATE pokemon_master SET name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 898 AND form_name = 'Normal') || ' (Ice Calyrex)' WHERE pokemon_id = 898 AND form_name = 'Cavalier du Froid';
UPDATE pokemon_master SET name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 898 AND form_name = 'Normal') || ' (Coronospa (Schimmelreiter))' WHERE pokemon_id = 898 AND form_name = 'Cavalier du Froid';
-- Found calyrex-shadow
UPDATE pokemon_master SET image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10194.png' WHERE pokemon_id = 898 AND form_name = 'Cavalier d'Effroi';
UPDATE pokemon_master SET name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 898 AND form_name = 'Normal') || ' (Shadow Calyrex)' WHERE pokemon_id = 898 AND form_name = 'Cavalier d'Effroi';
UPDATE pokemon_master SET name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 898 AND form_name = 'Normal') || ' (Coronospa (Rappenreiter))' WHERE pokemon_id = 898 AND form_name = 'Cavalier d'Effroi';
-- Found tornadus-therian
UPDATE pokemon_master SET image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10019.png' WHERE pokemon_id = 641 AND form_name = 'Totémique';
UPDATE pokemon_master SET name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 641 AND form_name = 'Normal') || ' (Therian Tornadus)' WHERE pokemon_id = 641 AND form_name = 'Totémique';
UPDATE pokemon_master SET name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 641 AND form_name = 'Normal') || ' (Boreos (Tiergeist))' WHERE pokemon_id = 641 AND form_name = 'Totémique';
-- Found thundurus-therian
UPDATE pokemon_master SET image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10020.png' WHERE pokemon_id = 642 AND form_name = 'Totémique';
UPDATE pokemon_master SET name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 642 AND form_name = 'Normal') || ' (Therian Thundurus)' WHERE pokemon_id = 642 AND form_name = 'Totémique';
UPDATE pokemon_master SET name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 642 AND form_name = 'Normal') || ' (Voltolos (Tiergeist))' WHERE pokemon_id = 642 AND form_name = 'Totémique';
-- Found landorus-therian
UPDATE pokemon_master SET image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10021.png' WHERE pokemon_id = 645 AND form_name = 'Totémique';
UPDATE pokemon_master SET name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 645 AND form_name = 'Normal') || ' (Therian Landorus)' WHERE pokemon_id = 645 AND form_name = 'Totémique';
UPDATE pokemon_master SET name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 645 AND form_name = 'Normal') || ' (Demeteros (Tiergeist))' WHERE pokemon_id = 645 AND form_name = 'Totémique';
-- Found enamorus-therian
UPDATE pokemon_master SET image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10249.png' WHERE pokemon_id = 905 AND form_name = 'Totémique';
UPDATE pokemon_master SET name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 905 AND form_name = 'Normal') || ' (Therian Enamorus)' WHERE pokemon_id = 905 AND form_name = 'Totémique';
UPDATE pokemon_master SET name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 905 AND form_name = 'Normal') || ' (Enamorus (Tiergeist))' WHERE pokemon_id = 905 AND form_name = 'Totémique';
-- Found giratina-origin
UPDATE pokemon_master SET image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10007.png' WHERE pokemon_id = 487 AND form_name = 'Originelle';
UPDATE pokemon_master SET name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 487 AND form_name = 'Normal') || ' (Origin Giratina)' WHERE pokemon_id = 487 AND form_name = 'Originelle';
UPDATE pokemon_master SET name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 487 AND form_name = 'Normal') || ' (Ur-Giratina)' WHERE pokemon_id = 487 AND form_name = 'Originelle';
-- Found shaymin-sky
UPDATE pokemon_master SET image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10006.png' WHERE pokemon_id = 492 AND form_name = 'Céleste';
UPDATE pokemon_master SET name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 492 AND form_name = 'Normal') || ' (Sky Shaymin)' WHERE pokemon_id = 492 AND form_name = 'Céleste';
UPDATE pokemon_master SET name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 492 AND form_name = 'Normal') || ' (Shaymin (Zenit))' WHERE pokemon_id = 492 AND form_name = 'Céleste';
-- Found hoopa-unbound
UPDATE pokemon_master SET image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10086.png' WHERE pokemon_id = 720 AND form_name = 'Déchaîné';
UPDATE pokemon_master SET name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 720 AND form_name = 'Normal') || ' (Hoopa Unbound)' WHERE pokemon_id = 720 AND form_name = 'Déchaîné';
UPDATE pokemon_master SET name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 720 AND form_name = 'Normal') || ' (Entfesseltes Hoopa)' WHERE pokemon_id = 720 AND form_name = 'Déchaîné';
-- Found keldeo-resolute
UPDATE pokemon_master SET image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10024.png' WHERE pokemon_id = 647 AND form_name = 'Décidé';
UPDATE pokemon_master SET name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 647 AND form_name = 'Normal') || ' (Resolute Keldeo)' WHERE pokemon_id = 647 AND form_name = 'Décidé';
UPDATE pokemon_master SET name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 647 AND form_name = 'Normal') || ' (Keldeo (Resolut))' WHERE pokemon_id = 647 AND form_name = 'Décidé';
-- Found meloetta-pirouette
UPDATE pokemon_master SET image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10018.png' WHERE pokemon_id = 648 AND form_name = 'Danse';
UPDATE pokemon_master SET name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 648 AND form_name = 'Normal') || ' (Pirouette Meloetta)' WHERE pokemon_id = 648 AND form_name = 'Danse';
UPDATE pokemon_master SET name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 648 AND form_name = 'Normal') || ' (Meloetta (Tanz))' WHERE pokemon_id = 648 AND form_name = 'Danse';
-- Found zygarde-10
UPDATE pokemon_master SET image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10181.png' WHERE pokemon_id = 718 AND form_name = '10%';
UPDATE pokemon_master SET name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 718 AND form_name = 'Normal') || ' (10% Zygarde)' WHERE pokemon_id = 718 AND form_name = '10%';
UPDATE pokemon_master SET name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 718 AND form_name = 'Normal') || ' (Zygarde (10%))' WHERE pokemon_id = 718 AND form_name = '10%';
-- Found zygarde-complete
UPDATE pokemon_master SET image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10120.png' WHERE pokemon_id = 718 AND form_name = 'Complete';
UPDATE pokemon_master SET name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 718 AND form_name = 'Normal') || ' (Complete Zygarde)' WHERE pokemon_id = 718 AND form_name = 'Complete';
UPDATE pokemon_master SET name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 718 AND form_name = 'Normal') || ' (Zygarde (Optimum))' WHERE pokemon_id = 718 AND form_name = 'Complete';
-- Found wishiwashi-school
UPDATE pokemon_master SET image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10127.png' WHERE pokemon_id = 746 AND form_name = 'Banc';
UPDATE pokemon_master SET name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 746 AND form_name = 'Normal') || ' (School Wishiwashi)' WHERE pokemon_id = 746 AND form_name = 'Banc';
UPDATE pokemon_master SET name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 746 AND form_name = 'Normal') || ' (Lusardin (Schwarm))' WHERE pokemon_id = 746 AND form_name = 'Banc';
-- Found mimikyu-busted
UPDATE pokemon_master SET image_url = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/10143.png' WHERE pokemon_id = 778 AND form_name = 'Démasquée';
UPDATE pokemon_master SET name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = 778 AND form_name = 'Normal') || ' (Busted Mimikyu)' WHERE pokemon_id = 778 AND form_name = 'Démasquée';
UPDATE pokemon_master SET name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = 778 AND form_name = 'Normal') || ' (Mimigma (Entlarvt))' WHERE pokemon_id = 778 AND form_name = 'Démasquée';
