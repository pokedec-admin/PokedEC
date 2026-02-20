const { Pool } = require('pg');
const axios = require('axios');

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'db',
    database: process.env.DB_NAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

async function updatePokemonNames() {
    try {
        console.log('🔄 Fetching all Pokemon from database...');
        const result = await pool.query('SELECT DISTINCT pokemon_id FROM pokedex ORDER BY pokemon_id');
        const pokemonIds = result.rows.map(row => row.pokemon_id);

        console.log(`📊 Found ${pokemonIds.length} unique Pokemon to update`);

        for (const pokemonId of pokemonIds) {
            try {
                console.log(`\n🔍 Fetching names for Pokemon #${pokemonId}...`);

                const speciesResponse = await axios.get(`https://pokeapi.co/api/v2/pokemon-species/${pokemonId}`);
                const speciesNames = speciesResponse.data.names || [];

                const frName = speciesNames.find(n => n.language.name === 'fr');
                const enName = speciesNames.find(n => n.language.name === 'en');
                const deName = speciesNames.find(n => n.language.name === 'de');
                const itName = speciesNames.find(n => n.language.name === 'it');
                const ptName = speciesNames.find(n => n.language.name === 'pt');

                const names = {
                    fr: frName ? frName.name : null,
                    en: enName ? enName.name : null,
                    de: deName ? deName.name : null,
                    it: itName ? itName.name : null,
                    pt: ptName ? ptName.name : null
                };

                console.log(`  FR: ${names.fr}`);
                console.log(`  EN: ${names.en}`);
                console.log(`  DE: ${names.de}`);
                console.log(`  IT: ${names.it}`);
                console.log(`  PT: ${names.pt}`);

                await pool.query(
                    `UPDATE pokedex 
                     SET name_fr = $1, name_en = $2, name_de = $3, name_it = $4, name_pt = $5
                     WHERE pokemon_id = $6`,
                    [names.fr, names.en, names.de, names.it, names.pt, pokemonId]
                );

                console.log(`✅ Updated Pokemon #${pokemonId}`);

                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));

            } catch (error) {
                console.error(`❌ Failed to update Pokemon #${pokemonId}:`, error.message);
            }
        }

        console.log('\n🎉 Migration complete!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await pool.end();
    }
}

updatePokemonNames();
