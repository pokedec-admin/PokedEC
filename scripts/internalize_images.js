const { Pool } = require('pg');
const axios = require('axios').default;
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// DB Config
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

async function internalizeImages() {
    const client = await pool.connect();
    try {
        const res = await client.query(`
            SELECT id, pokemon_id, form_name, image_url
            FROM pokemon_master
            WHERE image_url IS NOT NULL
            AND (image_url LIKE 'http%' AND image_url NOT LIKE '%supabase.co/storage%')
        `);

        console.log(`🚀 Found ${res.rows.length} images to internalize to Supabase...`);

        for (const row of res.rows) {
            const safeFormName = normalizeFileName(row.form_name);
            const fileName = `${row.pokemon_id}_${safeFormName}.png`;

            try {
                console.log(`📥 Internalizing ${row.pokemon_id} ${row.form_name} -> ${fileName}`);
                const buffer = await downloadToBuffer(row.image_url);

                const { error } = await supabase.storage
                    .from('pokemon')
                    .upload(fileName, buffer, {
                        contentType: 'image/png',
                        upsert: true
                    });

                if (error) throw error;

                const { data: { publicUrl } } = supabase.storage
                    .from('pokemon')
                    .getPublicUrl(fileName);

                // Update DB
                await client.query(
                    'UPDATE pokemon_master SET image_url = $1 WHERE id = $2',
                    [publicUrl, row.id]
                );
                console.log(`✅ ${fileName} internalized and DB updated`);

            } catch (err) {
                console.error(`❌ Failed to internalize ${row.pokemon_id}:`, err.message);
            }
        }

        console.log('✅ All images internalized to Supabase!');
    } finally {
        client.release();
        await pool.end();
    }
}

internalizeImages();
