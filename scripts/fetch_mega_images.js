const { Pool } = require('pg');
const axios = require('axios').default;
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Config
const poolConfig = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
  : {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
    ssl: { rejectUnauthorized: false }
  };

const pool = new Pool(poolConfig);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const normalizeFileName = (name) => {
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/ /g, '_')
        .replace(/[^a-z0-9_-]/g, '');
};

async function downloadToBuffer(url) {
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'arraybuffer'
    });
    return Buffer.from(response.data);
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
        if (pageId !== "-1") return pages[pageId].imageinfo[0].url;
    } catch (e) {}

    const fileNameNoSuffix = `Méga-${normalizedPokemon}.png`;
    const apiUrlNoSuffix = `https://www.pokepedia.fr/api.php?action=query&titles=Fichier:${encodeURIComponent(fileNameNoSuffix)}&prop=imageinfo&iiprop=url&format=json`;

    try {
        const response = await axios.get(apiUrlNoSuffix);
        const pages = response.data.query.pages;
        const pageId = Object.keys(pages)[0];
        if (pageId !== "-1") return pages[pageId].imageinfo[0].url;
    } catch (e) {}
    return null;
}

async function getPokeApiImageUrl(pokemonId, formName) {
    let suffix = "-mega";
    if (formName.includes("X")) suffix = "-mega-x";
    if (formName.includes("Y")) suffix = "-mega-y";

    try {
        const speciesRes = await axios.get(`https://pokeapi.co/api/v2/pokemon-species/${pokemonId}`);
        const megaVariety = speciesRes.data.varieties.find(v => v.pokemon.name.includes(suffix));
        if (megaVariety) {
            const pokeRes = await axios.get(megaVariety.pokemon.url);
            return pokeRes.data.sprites.other['official-artwork'].front_default || pokeRes.data.sprites.front_default;
        }
    } catch (e) {}
    return null;
}

async function run() {
    const client = await pool.connect();
    try {
        console.log("🔍 Fetching Mega forms from database...");
        const res = await client.query(`
            SELECT pm.id, pm.pokemon_id, pm.form_name, pm.name_fr
            FROM pokemon_master pm
            JOIN pokemon_category_availability pca ON pm.pokemon_id = pca.pokemon_id AND pm.form_name = pca.form_name
            WHERE pm.form_name LIKE 'Méga%' OR pm.form_name LIKE 'Mega%'
        `);

        for (const row of res.rows) {
            console.log(`\n📦 Processing: ${row.name_fr} (${row.form_name})`);
            let imageUrl = await getPokepediaImageUrl(row.name_fr, row.form_name);
            if (!imageUrl) imageUrl = await getPokeApiImageUrl(row.pokemon_id, row.form_name);

            if (imageUrl) {
                const finalFileName = `${row.pokemon_id}_${normalizeFileName(row.form_name)}.png`;
                try {
                    console.log(`  📥 Downloading and uploading to Supabase...`);
                    const buffer = await downloadToBuffer(imageUrl);
                    const { error } = await supabase.storage.from('pokemon').upload(finalFileName, buffer, {
                        contentType: 'image/png',
                        upsert: true
                    });
                    if (error) throw error;

                    const { data: { publicUrl } } = supabase.storage.from('pokemon').getPublicUrl(finalFileName);
                    await client.query('UPDATE pokemon_master SET image_url = $1 WHERE id = $2', [publicUrl, row.id]);
                    console.log(`  ✅ Successfully updated DB: ${publicUrl}`);
                } catch (err) {
                    console.error(`  ❌ Error:`, err.message);
                }
            }
        }
    } finally {
        client.release();
        await pool.end();
    }
}

run().catch(console.error);
