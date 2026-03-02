const { Pool } = require('pg');
const axios = require('axios').default;
const fs = require('fs');
const path = require('path');

// Render Database environment variables
const poolConfig = process.env.DATABASE_URL
  ? {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  }
  : {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
    ssl: { rejectUnauthorized: false }
  };

const pool = new Pool(poolConfig);
const IMAGE_DIR = path.join(__dirname, '../frontend/public/images/pokemon');

async function downloadImage(url, filepath) {
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
    });
    return new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(filepath);
        response.data.pipe(writer);
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}

async function getPokepediaImageUrl(pokemonName, formName) {
    const normalizedPokemon = pokemonName.charAt(0).toUpperCase() + pokemonName.slice(1);

    let suffix = "-XY";
    if (formName.includes("X")) suffix = "-X";
    if (formName.includes("Y")) suffix = "-Y";

    const fileName = `Méga-${normalizedPokemon}${suffix}.png`;
    const apiUrl = `https://www.pokepedia.fr/api.php?action=query&titles=Fichier:${encodeURIComponent(fileName)}&prop=imageinfo&iiprop=url&format=json`;

    try {
        const response = await axios.get(apiUrl);
        const pages = response.data.query.pages;
        const pageId = Object.keys(pages)[0];
        if (pageId !== "-1") {
            return pages[pageId].imageinfo[0].url;
        }
    } catch (e) {
        console.error(`  ❌ Pokepedia API error for ${fileName}:`, e.message);
    }

    const fileNameNoSuffix = `Méga-${normalizedPokemon}.png`;
    const apiUrlNoSuffix = `https://www.pokepedia.fr/api.php?action=query&titles=Fichier:${encodeURIComponent(fileNameNoSuffix)}&prop=imageinfo&iiprop=url&format=json`;

    try {
        const response = await axios.get(apiUrlNoSuffix);
        const pages = response.data.query.pages;
        const pageId = Object.keys(pages)[0];
        if (pageId !== "-1") {
            return pages[pageId].imageinfo[0].url;
        }
    } catch (e) {
        console.error(`  ❌ Pokepedia API error for ${fileNameNoSuffix}:`, e.message);
    }

    return null;
}

async function getPokeApiImageUrl(pokemonId, formName) {
    let suffix = "-mega";
    if (formName.includes("X")) suffix = "-mega-x";
    if (formName.includes("Y")) suffix = "-mega-y";

    try {
        const speciesRes = await axios.get(`https://pokeapi.co/api/v2/pokemon-species/${pokemonId}`);
        const varieties = speciesRes.data.varieties;
        const megaVariety = varieties.find(v => v.pokemon.name.includes(suffix));

        if (megaVariety) {
            const pokeRes = await axios.get(megaVariety.pokemon.url);
            return pokeRes.data.sprites.other['official-artwork'].front_default || pokeRes.data.sprites.front_default;
        }
    } catch (e) {
        console.error(`  ❌ PokeAPI error for ID ${pokemonId}:`, e.message);
    }
    return null;
}

async function run() {
    if (!fs.existsSync(IMAGE_DIR)) {
        fs.mkdirSync(IMAGE_DIR, { recursive: true });
    }

    const client = await pool.connect();
    try {
        console.log("🔍 Fetching Mega forms from database...");
        const res = await client.query(`
            SELECT pm.id, pm.pokemon_id, pm.form_name, pm.name_fr, pm.name_en
            FROM pokemon_master pm
            JOIN pokemon_category_availability pca ON pm.pokemon_id = pca.pokemon_id AND pm.form_name = pca.form_name
            WHERE pm.form_name LIKE 'Méga%' OR pm.form_name LIKE 'Mega%'
        `);

        console.log(`🚀 Found ${res.rows.length} Mega forms to process.`);

        for (const row of res.rows) {
            console.log(`\n📦 Processing: ${row.name_fr} (${row.form_name})`);

            let imageUrl = await getPokepediaImageUrl(row.name_fr, row.form_name);
            let source = "Pokepedia";

            if (!imageUrl) {
                console.log(`  ⚠️  Not found on Pokepedia, trying PokeAPI...`);
                imageUrl = await getPokeApiImageUrl(row.pokemon_id, row.form_name);
                source = "PokeAPI";
            }

            if (imageUrl) {
                const safeFormName = row.form_name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ /g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
                const fileName = `${row.pokemon_id}_${safeFormName}.png`;
                const filePath = path.join(IMAGE_DIR, fileName);
                const localUrl = `/images/pokemon/${fileName}`;

                try {
                    console.log(`  📥 Downloading from ${source}: ${imageUrl}`);
                    await downloadImage(imageUrl, filePath);

                    await client.query(
                        'UPDATE pokemon_master SET image_url = $1 WHERE id = $2',
                        [localUrl, row.id]
                    );
                    console.log(`  ✅ Successfully updated DB for ${row.name_fr}`);
                } catch (err) {
                    console.error(`  ❌ Download error:`, err.message);
                }
            } else {
                console.log(`  ❌ Image not found for ${row.name_fr} in any source.`);
            }
        }
    } finally {
        client.release();
        await pool.end();
        console.log("\n🏁 Finished processing Mega images.");
    }
}

run().catch(err => {
    console.error("FATAL ERROR:", err);
    process.exit(1);
});
