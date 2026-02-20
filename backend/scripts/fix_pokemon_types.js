const { Pool } = require('pg');
const https = require('https');

// DB Config
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'db',
    database: process.env.DB_NAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

const TYPE_MAPPING = {
    'normal': 10,
    'fighting': 2,
    'flying': 18,
    'poison': 12,
    'ground': 15,
    'rock': 14,
    'bug': 9,
    'ghost': 16,
    'steel': 1,
    'fire': 7,
    'water': 4,
    'grass': 11,
    'electric': 5,
    'psychic': 13,
    'ice': 8,
    'dragon': 3,
    'dark': 17,
    'fairy': 6
};

function fetchPokemonType(id) {
    return new Promise((resolve, reject) => {
        const url = `https://pokeapi.co/api/v2/pokemon/${id}`;
        https.get(url, (res) => {
            if (res.statusCode !== 200) {
                res.resume();
                return resolve(null); // Skip if not found
            }
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    const types = json.types.sort((a, b) => a.slot - b.slot).map(t => t.type.name);
                    resolve(types);
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

async function main() {
    console.log('🚀 Starting Pokemon Type Fix...');
    let errorsFound = 0;
    let updatedCount = 0;

    try {
        // Get current DB state
        const dbRes = await pool.query('SELECT pokemon_id, type_primary_id, type_secondary_id FROM pokemon_master ORDER BY pokemon_id');
        const dbPokemon = new Map(dbRes.rows.map(r => [r.pokemon_id, r]));

        // Process in chunks to avoid rate limiting
        const CHUNK_SIZE = 50;
        for (let i = 1; i <= 1025; i += CHUNK_SIZE) {
            const promises = [];
            for (let j = i; j < i + CHUNK_SIZE && j <= 1025; j++) {
                promises.push(fetchPokemonType(j).then(types => ({ id: j, types })));
            }

            const results = await Promise.all(promises);

            for (const { id, types } of results) {
                if (!types) continue;

                const primaryType = types[0];
                const secondaryType = types[1] || null;

                const primaryId = TYPE_MAPPING[primaryType];
                const secondaryId = secondaryType ? TYPE_MAPPING[secondaryType] : null;

                const current = dbPokemon.get(id);
                if (!current) continue; // Skip if not in DB

                // Check for mismatch
                if (current.type_primary_id !== primaryId || current.type_secondary_id !== secondaryId) {
                    errorsFound++;
                    // console.log(`Mismatch for #${id}: DB[${current.type_primary_id}, ${current.type_secondary_id}] vs API[${primaryId} (${primaryType}), ${secondaryId} (${secondaryType})]`);

                    await pool.query(
                        'UPDATE pokemon_master SET type_primary_id = $1, type_secondary_id = $2 WHERE pokemon_id = $3',
                        [primaryId, secondaryId, id]
                    );
                    updatedCount++;
                }
            }
            process.stdout.write(`Processed ${Math.min(i + CHUNK_SIZE - 1, 1025)}/1025... Errors: ${errorsFound}\r`);
        }

        console.log(`\n✅ Finished!`);
        console.log(`❌ Errors found: ${errorsFound}`);
        console.log(`✨ Fixed: ${updatedCount}`);

    } catch (err) {
        console.error('Fatal Error:', err);
    } finally {
        await pool.end();
    }
}

main();
