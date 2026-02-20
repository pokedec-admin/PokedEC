const https = require('https');
const fs = require('fs');

const TYPE_MAPPING = {
    'steel': 1, 'fighting': 2, 'dragon': 3, 'water': 4, 'electric': 5, 'fairy': 6,
    'fire': 7, 'ice': 8, 'bug': 9, 'normal': 10, 'grass': 11, 'poison': 12,
    'psychic': 13, 'rock': 14, 'ground': 15, 'ghost': 16, 'dark': 17, 'flying': 18
};

const REGION_MAPPING = {
    'Alola': 7, 'Galar': 8, 'Hisui': 9, 'Paldea': 10
};

const FORM_SLUG_MAPPING = {
    'Alola': 'alola', 'Galar': 'galar', 'Hisui': 'hisui', 'Paldea': 'paldea',
    'Épée Suprême': 'crowned', 'Bouclier Suprême': 'crowned',
    'Noir': 'black', 'Blanc': 'white', 'Crinière du Couchant': 'dusk', 'Ailes de l\'Aurore': 'dawn',
    'Ultra': 'ultra', 'Cavalier du Froid': 'ice', 'Cavalier d\'Effroi': 'shadow',
    'Pom-Pom': 'pom-pom', 'Hula': 'pau', 'Buyō': 'sensu', 'Nocturne': 'midnight', 'Crépusculaire': 'dusk',
    'Banc': 'school', 'Météore': 'meteor', 'Démasquée': 'busted', 'Solaire': 'sunny',
    'Eau de Pluie': 'rainy', 'Blizzard': 'snowy', 'Attaque': 'attack', 'Défense': 'defense',
    'Vitesse': 'speed', 'Sable': 'sandy', 'Déchet': 'trash', 'Ensoleillée': 'sunshine',
    'Orient': 'east', 'Chaleur': 'heat', 'Lavage': 'wash', 'Froid': 'frost', 'Hélice': 'fan',
    'Tonte': 'mow', 'Originelle': 'origin', 'Céleste': 'sky', 'Été': 'summer', 'Automne': 'autumn',
    'Hiver': 'winter', 'Totémique': 'therian', 'Décidé': 'resolute', 'Danse': 'pirouette',
    '10%': '10', 'Complete': 'complete', 'Petit': 'small', 'Grand': 'large', 'Ultra': 'super'
};

const fetchJson = (url) => new Promise((resolve, reject) => {
    https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            if (res.statusCode === 404) return resolve(null);
            try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
        });
    }).on('error', reject);
});

async function main() {
    const targets = [
        { id: 26, forms: ['Alola'] }, { id: 38, forms: ['Alola'] }, { id: 37, forms: ['Alola'] },
        { id: 19, forms: ['Alola'] }, { id: 27, forms: ['Alola'] }, { id: 50, forms: ['Alola'] },
        { id: 52, forms: ['Alola', 'Galar'] }, { id: 74, forms: ['Alola'] }, { id: 88, forms: ['Alola'] },
        { id: 103, forms: ['Alola'] }, { id: 105, forms: ['Alola'] }, { id: 77, forms: ['Galar'] },
        { id: 79, forms: ['Galar'] }, { id: 83, forms: ['Galar'] }, { id: 110, forms: ['Galar'] },
        { id: 122, forms: ['Galar'] }, { id: 144, forms: ['Galar'] }, { id: 145, forms: ['Galar'] },
        { id: 146, forms: ['Galar'] }, { id: 554, forms: ['Galar'] }, { id: 618, forms: ['Galar'] },
        { id: 58, forms: ['Hisui'] }, { id: 100, forms: ['Hisui'] }, { id: 157, forms: ['Hisui'] },
        { id: 211, forms: ['Hisui'] }, { id: 503, forms: ['Hisui'] }, { id: 570, forms: ['Hisui'] },
        { id: 705, forms: ['Hisui'] }, { id: 713, forms: ['Hisui'] }, { id: 724, forms: ['Hisui'] },
        { id: 128, forms: ['Paldea'] }, { id: 194, forms: ['Paldea'] },
        { id: 646, forms: ['Noir', 'Blanc'] }, { id: 800, forms: ['Crinière du Couchant', 'Ailes de l\'Aurore', 'Ultra'] },
        { id: 888, forms: ['Épée Suprême'] }, { id: 889, forms: ['Bouclier Suprême'] },
        { id: 898, forms: ['Cavalier du Froid', 'Cavalier d\'Effroi'] },
        { id: 741, forms: ['Pom-Pom', 'Hula', 'Buyō'] }, { id: 666, forms: ['Archipel', 'Banquise', 'Blizzard', 'Continent', 'Cyclone', 'Delta', 'Fantaisie', 'Floraison', 'Glace', 'Jungle', 'Mangrove', 'Métropole', 'Monarchie', 'Poké Ball', 'Rivage', 'Sable', 'Sécheresse', 'Soleil Levant', 'Verdure', 'Zénith'] }
    ];

    let sql = `-- MIGRATION DES DONNÉES MAÎTRES DES FORMES\n\n`;

    for (const t of targets) {
        const species = await fetchJson(`https://pokeapi.co/api/v2/pokemon-species/${t.id}/`);
        if (!species) continue;

        for (const f of t.forms) {
            const slug = FORM_SLUG_MAPPING[f];
            const variantName = `${species.name}-${slug}`;
            const pokemon = await fetchJson(`https://pokeapi.co/api/v2/pokemon/${variantName}/`);

            if (pokemon) {
                const type1 = TYPE_MAPPING[pokemon.types[0].type.name];
                const type2 = pokemon.types[1] ? TYPE_MAPPING[pokemon.types[1].type.name] : 'NULL';
                const image = pokemon.sprites.other['official-artwork'].front_default || pokemon.sprites.front_default;
                const regionId = REGION_MAPPING[f] || 'region_id'; // Fallback to current region if not regional variant

                // Extract translations from the form endpoint
                let nameEn = "", nameDe = "", nameIt = "";
                if (pokemon.forms && pokemon.forms[0]) {
                    const formDetails = await fetchJson(pokemon.forms[0].url);
                    if (formDetails && formDetails.names) {
                        nameEn = formDetails.names.find(n => n.language.name === 'en')?.name || '';
                        nameDe = formDetails.names.find(n => n.language.name === 'de')?.name || '';
                        nameIt = formDetails.names.find(n => n.language.name === 'it')?.name || '';
                    }
                }

                // If no specific form name translation, fallback to f
                if (!nameEn) nameEn = f;
                if (!nameDe) nameDe = f;
                if (!nameIt) nameIt = f;

                const escapedF = f.replace(/'/g, "''");

                // Building Dynamic SQL
                sql += `-- Data for ${variantName} (${f})\n`;
                sql += `UPDATE pokemon_master SET \n`;
                sql += `  type_primary_id = ${type1}, \n`;
                sql += `  type_secondary_id = ${type2}, \n`;
                if (image) sql += `  image_url = '${image}', \n`;
                if (REGION_MAPPING[f]) sql += `  region_id = ${REGION_MAPPING[f]}, \n`;

                // Construct titles using subqueries to get species name
                sql += `  name_en = (SELECT name_en FROM pokemon_master WHERE pokemon_id = ${t.id} AND form_name = 'Normal') || ' (' || '${nameEn.replace(/'/g, "''")}' || ')', \n`;
                sql += `  name_de = (SELECT name_de FROM pokemon_master WHERE pokemon_id = ${t.id} AND form_name = 'Normal') || ' (' || '${nameDe.replace(/'/g, "''")}' || ')', \n`;
                sql += `  name_it = (SELECT name_it FROM pokemon_master WHERE pokemon_id = ${t.id} AND form_name = 'Normal') || ' (' || '${nameIt.replace(/'/g, "''")}' || ')', \n`;

                // Remove last comma and add WHERE
                sql = sql.trim().replace(/,$/, '') + `\nWHERE pokemon_id = ${t.id} AND form_name = '${escapedF}';\n\n`;
            }
        }
    }
    fs.writeFileSync('backend/migrations/update_forms_master_data.sql', sql);
    console.log('Fichier SQL généré : backend/migrations/update_forms_master_data.sql');
}

main().catch(console.error);
