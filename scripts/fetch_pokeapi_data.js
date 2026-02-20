const https = require('https');
const fs = require('fs');

// Mappings manually adjusted or common patterns
const FORM_SLUG_MAPPING = {
    // Alola
    'Alola': 'alola',
    // Galar
    'Galar': 'galar',
    // Hisui
    'Hisui': 'hisui',
    // Paldea
    'Paldea': 'paldea',

    // Oricorio
    'Pom-Pom': 'pom-pom',
    'Hula': 'pau', // Pa'u style
    'Buyō': 'sensu',

    // Lycanroc
    'Nocturne': 'midnight',
    'Crépusculaire': 'dusk',

    // Wishiwashi
    'Banc': 'school',

    // Minior
    'Météore': 'meteor',

    // Mimikyu
    'Démasquée': 'busted',

    // Necrozma
    'Crinière du Couchant': 'dusk',
    "Ailes de l'Aurore": 'dawn',
    'Ultra': 'ultra',

    // Castform
    'Solaire': 'sunny',
    'Eau de Pluie': 'rainy',
    'Blizzard': 'snowy',

    // Deoxys
    'Attaque': 'attack',
    'Défense': 'defense',
    'Vitesse': 'speed',

    // Wormadam
    'Sable': 'sandy',
    'Déchet': 'trash',

    // Cherrim
    'Ensoleillée': 'sunshine',

    // Shellos/Gastrodon
    'Orient': 'east',

    // Rotom
    'Chaleur': 'heat',
    'Lavage': 'wash',
    'Froid': 'frost',
    'Hélice': 'fan',
    'Tonte': 'mow',

    // Giratina
    'Originelle': 'origin',

    // Shaymin
    'Céleste': 'sky',

    // Arceus - Types are usually mapped to english type names

    // Basculin
    'Bleu': 'blue-striped',
    'Blanc': 'white-striped',

    // Darmanitan
    'Transe': 'zen',

    // Deerling/Sawsbuck
    'Été': 'summer',
    'Automne': 'autumn',
    'Hiver': 'winter',

    // Thundurus/Tornadus/Landorus
    'Totémique': 'therian',

    // Kyurem
    'Noir': 'black',
    'Blanc': 'white',

    // Keldeo
    'Décidé': 'resolute',

    // Meloetta
    'Danse': 'pirouette',

    // Genesect
    // 'Choc', 'Burn', 'Chill', 'Douse' -> drives

    // Greninja
    'Ash': 'ash',

    // Vivillon
    'Archipel': 'archipelago',
    'Banquise': 'continental', // Wait, check mapping
    'Blizzard': 'icy-snow',
    'Continent': 'continental',
    'Cyclone': 'monsoon',
    'Delta': 'river',
    'Fantaisie': 'fancy',
    'Floraison': 'garden',
    'Glace': 'polar',
    'Jungle': 'jungle',
    'Mangrove': 'mangrove',
    'Métropole': 'modern',
    'Monarchie': 'elegant',
    'Poké Ball': 'pokeball',
    'Rivage': 'marine',
    'Sable': 'sandstorm',
    'Sécheresse': 'high-plains',
    'Soleil Levant': 'sun',
    'Verdure': 'meadow',
    'Zénith': 'savanna',

    // Flabebe
    'Jaune': 'yellow',
    'Orange': 'orange',
    'Bleue': 'blue',
    'Blanche': 'white',

    // Furfrou
    'Cœur': 'heart',
    'Étoile': 'star',
    'Diamant': 'diamond',
    'Demoiselle': 'debutante',
    'Madame': 'matron',
    'Monsieur': 'dandy',
    'Reine': 'la-reine',
    'Kabuki': 'kabuki',
    'Pharaon': 'pharaoh',

    // Aegislash
    'Assaut': 'blade',

    // Pumpkaboo/Gourgeist - Sizes
    'Petit': 'small',
    'Grand': 'large',
    'Ultra': 'super',

    // Zygarde
    '10%': '10',
    'Complete': 'complete',

    // Hoopa
    'Déchaîné': 'unbound',

    // Unown
    '!': 'exclamation',
    '?': 'question',

    // Legendary Forms Mappings
    'Épée Suprême': 'crowned',
    'Bouclier Suprême': 'crowned',
    'Cavalier du Froid': 'ice',
    'Cavalier d\'Effroi': 'shadow',
    'Crinière du Couchant': 'dusk',
    // 'Ailes de l\'Aurore': 'dawn', // Already added
    // 'Ultra': 'ultra', // Already added
    'Noir': 'black',
    'Blanc': 'white',
    // 'Totémique': 'therian', // Already added
    'Originelle': 'origin',
    'Céleste': 'sky',
    'Déchaîné': 'unbound',
    'Décidé': 'resolute',
    'Danse': 'pirouette',
    '10%': '10',
    'Complete': 'complete',
    'Banc': 'school',
    'Démasquée': 'busted'
};

// Helper: fetch URL
const fetchJson = (url) => {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
};

const main = async () => {
    // We will generate SQL statements
    const sqlStatements = [];

    // We assume we have a list of pokemon_id + form_name tuples to check
    // Since we can't query the DB directly easily from this script without pg, 
    // let's just iterate over known IDs that might have forms.
    // Or better, fetch the species data from PokeAPI and get all varieties.

    // Let's focus on generations that introduced forms heavily + Regionals
    // 1-151 (Alola/Galar/Paldea forms)
    // 201 (Unown)
    // Castform (351)
    // Deoxys (386)
    // Burmy/Wormadam (412/413)
    // Cherrim (421)
    // Shellos/Gastrodon (422/423)
    // Rotom (479)
    // Giratina (487)
    // Shaymin (492)
    // Arceus (493)
    // Basculin (550)
    // Darmanitan (555)
    // Deerling/Sawsbuck (585/586)
    // Tornadus/Thundurus/Landorus (641/642/645)
    // Kyurem (646)
    // Keldeo (647)
    // Meloetta (648)
    // Genesect (649)
    // Vivillon (666) - Complex
    // Flabebe line (669-671)
    // Furfrou (676)
    // Aegislash (681)
    // Pumpkaboo/Gourgeist (710/711)
    // Xerneas/Yveltal/Zygarde (716-718)
    // Hoopa (720)
    // Oricorio (741)
    // Lycanroc (745)
    // Wishiwashi (746)
    // Silvally (773)
    // Minior (774)
    // Mimikyu (778)
    // Necrozma (800)
    // Magearna (801)
    // Toxtricity (849)
    // Eiscue (875)
    // Indeedee (876)
    // Morpeko (877)
    // Urshifu (892)
    // Zarude (893)
    // Calyrex (898)
    // Enamorus (905)
    // .. Paldea ones ..

    // For this task, we will try to update names and images for existing forms in our DB.
    // Since we can't read our DB, I will generate updates for likely candidates.

    console.log('-- SQL Script to update translations and images');

    // Example for a few complex ones
    const targets = [
        { id: 26, forms: ['Alola'] },
        { id: 38, forms: ['Alola'] },
        { id: 201, forms: ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '!', '?'] },
        { id: 351, forms: ['Solaire', 'Eau de Pluie', 'Blizzard'] }, // Castform
        { id: 386, forms: ['Attaque', 'Défense', 'Vitesse'] }, // Deoxys
        { id: 741, forms: ['Pom-Pom', 'Hula', 'Buyō'] }, // Oricorio
        { id: 412, forms: ['Sable', 'Déchet'] }, // Burmy
        { id: 413, forms: ['Sable', 'Déchet'] }, // Wormadam
        { id: 421, forms: ['Ensoleillée'] }, // Cherrim
        { id: 422, forms: ['Orient'] }, // Shellos
        { id: 423, forms: ['Orient'] }, // Gastrodon
        { id: 479, forms: ['Chaleur', 'Lavage', 'Froid', 'Hélice', 'Tonte'] }, // Rotom
        { id: 585, forms: ['Été', 'Automne', 'Hiver'] }, // Deerling
        { id: 586, forms: ['Été', 'Automne', 'Hiver'] }, // Sawsbuck
        { id: 676, forms: ['Cœur', 'Étoile', 'Diamant', 'Demoiselle', 'Madame', 'Monsieur', 'Reine', 'Kabuki', 'Pharaon'] }, // Furfrou
        { id: 666, forms: ['Archipel', 'Banquise', 'Blizzard', 'Continent', 'Cyclone', 'Delta', 'Fantaisie', 'Floraison', 'Glace', 'Jungle', 'Mangrove', 'Métropole', 'Monarchie', 'Poké Ball', 'Rivage', 'Sable', 'Sécheresse', 'Soleil Levant', 'Verdure', 'Zénith'] }, // Vivillon
        { id: 710, forms: ['Petit', 'Grand', 'Ultra'] }, // Pumpkaboo
        { id: 711, forms: ['Petit', 'Grand', 'Ultra'] }, // Gourgeist
        { id: 745, forms: ['Nocturne', 'Crépusculaire'] }, // Lycanroc
        { id: 669, forms: ['Jaune', 'Orange', 'Bleue', 'Blanche'] }, // Flabebe
        // Legendary Forms
        { id: 646, forms: ['Noir', 'Blanc'] }, // Kyurem
        { id: 800, forms: ['Crinière du Couchant', 'Ailes de l\'Aurore', 'Ultra'] }, // Necrozma
        { id: 888, forms: ['Épée Suprême'] }, // Zacian
        { id: 889, forms: ['Bouclier Suprême'] }, // Zamazenta
        { id: 898, forms: ['Cavalier du Froid', 'Cavalier d\'Effroi'] }, // Calyrex
        { id: 641, forms: ['Totémique'] }, // Tornadus
        { id: 642, forms: ['Totémique'] }, // Thundurus
        { id: 645, forms: ['Totémique'] }, // Landorus
        { id: 905, forms: ['Totémique'] }, // Enamorus
        { id: 487, forms: ['Originelle'] }, // Giratina
        { id: 492, forms: ['Céleste'] }, // Shaymin
        { id: 720, forms: ['Déchaîné'] }, // Hoopa
        { id: 647, forms: ['Décidé'] }, // Keldeo
        { id: 648, forms: ['Danse'] }, // Meloetta
        { id: 718, forms: ['10%', 'Complete'] }, // Zygarde
        { id: 746, forms: ['Banc'] }, // Wishiwashi
        { id: 778, forms: ['Démasquée'] } // Mimikyu
    ];

    // We will print SQL queries directly
    for (const t of targets) {
        for (const f of t.forms) {
            let apiSlug = '';

            // Determine API slug
            if (FORM_SLUG_MAPPING[f]) {
                apiSlug = FORM_SLUG_MAPPING[f];
            } else if (f.length === 1) {
                // For Unown
                apiSlug = f.toLowerCase();
                if (apiSlug === '!') apiSlug = 'exclamation';
                if (apiSlug === '?') apiSlug = 'question';
            } else {
                apiSlug = f.toLowerCase();
            }

            // Build full pokemon name for API
            // Usually: name-form
            // But checking species info is safer. 
            // Let's assume standard format: {id}-{slug} or {name}-{slug}
            // PokeAPI uses ID-based lookups for forms too? No, usually pokemon endpoint with ID or Name.
            // E.g. /pokemon/raichu-alola

            // Let's try to fetch species first to get the name
            try {
                // Get Species Name
                const speciesData = await fetchJson(`https://pokeapi.co/api/v2/pokemon-species/${t.id}/`);
                const speciesName = speciesData.name;

                // Construct variant name
                let variantName = `${speciesName}-${apiSlug}`;

                // Except for some cases (Regional forms usually follow this)
                // But Oricorio is oricorio-pom-pom

                // Try fetch pokemon data
                try {
                    const pokemonData = await fetchJson(`https://pokeapi.co/api/v2/pokemon/${variantName}/`);
                    console.log(`-- Found ${variantName}`);

                    // Get image
                    const imageUrl = pokemonData.sprites.other['official-artwork'].front_default || pokemonData.sprites.front_default;

                    if (imageUrl) {
                        console.log(`UPDATE pokemon_master SET image_url = '${imageUrl}' WHERE pokemon_id = ${t.id} AND form_name = '${f}';`);
                    }

                    // Translations? PokeAPI usually doesn't have form-specific translations easily accessible in the pokemon endpoint.
                    // They are in pokemon-form endpoint?

                    // Try fetch form endpoint
                    // pokemonData.forms[0].url
                    if (pokemonData.forms && pokemonData.forms.length > 0) {
                        const formData = await fetchJson(pokemonData.forms[0].url);

                        // Form names
                        if (formData.names && formData.names.length > 0) {
                            const en = formData.names.find(n => n.language.name === 'en')?.name;
                            const de = formData.names.find(n => n.language.name === 'de')?.name;
                            const it = formData.names.find(n => n.language.name === 'it')?.name;

                            // We update based on the form name, usually we concatenate "Species (Form)"
                            // But if we have specific form name "Sunny Form", we might use that.
                            // Our DB format is "Species (Form)".

                            // Let's rely on constructing it: "NameEn (FormEn)"
                            // But finding the translation of the form name itself (e.g. "Sunny" in DE) is hard if not in the names list.
                            // Actually formData.names DOES contain the form name translation usually.

                            if (en) console.log(`UPDATE pokemon_master SET name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = ${t.id} AND form_name = 'Normal') || ' (${en})' WHERE pokemon_id = ${t.id} AND form_name = '${f}';`);
                            if (de) console.log(`UPDATE pokemon_master SET name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = ${t.id} AND form_name = 'Normal') || ' (${de})' WHERE pokemon_id = ${t.id} AND form_name = '${f}';`);
                            if (it) console.log(`UPDATE pokemon_master SET name_it = (SELECT name_it FROM pokemon_master WHERE pokemon_id = ${t.id} AND form_name = 'Normal') || ' (${it})' WHERE pokemon_id = ${t.id} AND form_name = '${f}';`);
                        }
                    }

                } catch (e) {
                    console.log(`-- Could not find pokemon ${variantName}: ${e.message}`);
                }

            } catch (e) {
                console.error(`-- Error fetching species ${t.id}: ${e.message}`);
            }
        }
    }
};

main();
