const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
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

// Supabase Config
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const IMAGE_DIR = path.join(__dirname, '../frontend/public/images/pokemon');

const normalizeFileName = (name) => {
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/ /g, '_')
        .replace(/[^a-z0-9_-]/g, '');
};

async function run() {
    if (!fs.existsSync(IMAGE_DIR)) {
        console.log("ℹ️  Local image directory not found. Skipping physical migration.");
    } else {
        const files = fs.readdirSync(IMAGE_DIR).filter(f => f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg'));
        console.log(`🚀 Found ${files.length} local images to migrate...`);

        for (const file of files) {
            // Check if file follows pattern ID_Name.ext
            const match = file.match(/^(\d+)_(.+)\.(png|jpg|jpeg)$/);
            if (!match) {
                console.log(`  ⚠️  Skipping ${file}: does not match expected pattern ID_Name.ext`);
                continue;
            }

            const pokemonId = match[1];
            const originalName = match[2];
            const ext = match[3];

            const safeName = normalizeFileName(originalName);
            const finalFileName = `${pokemonId}_${safeName}.${ext}`;
            const filePath = path.join(IMAGE_DIR, file);

            try {
                console.log(`  📤 Uploading ${file} -> ${finalFileName}...`);
                const fileContent = fs.readFileSync(filePath);
                const { error } = await supabase.storage
                    .from('pokemon')
                    .upload(finalFileName, fileContent, {
                        contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
                        upsert: true
                    });

                if (error) throw error;

                const { data: { publicUrl } } = supabase.storage
                    .from('pokemon')
                    .getPublicUrl(finalFileName);

                console.log(`  ✅ Uploaded: ${publicUrl}`);
            } catch (err) {
                console.error(`  ❌ Failed to upload ${file}:`, err.message);
            }
        }
    }

    // Now update DB based on current pokemon_master entries that might already point to Supabase or need update
    const client = await pool.connect();
    try {
        console.log("\n🔄 Updating database entries to match Supabase Storage pattern...");
        const res = await client.query('SELECT id, pokemon_id, form_name, image_url FROM pokemon_master');

        for (const row of res.rows) {
            const safeFormName = normalizeFileName(row.form_name);
            const fileName = `${row.pokemon_id}_${safeFormName}.png`; // Assuming PNG for simplicity in mapping

            const { data: { publicUrl } } = supabase.storage
                .from('pokemon')
                .getPublicUrl(fileName);

            // We only update if it's not already correct or if it was local
            if (row.image_url !== publicUrl) {
                console.log(`  🆙 Updating DB for ${row.pokemon_id} ${row.form_name}: ${publicUrl}`);
                await client.query('UPDATE pokemon_master SET image_url = $1 WHERE id = $2', [publicUrl, row.id]);
            }
        }
        console.log("✅ Database sync completed!");

    } finally {
        client.release();
        await pool.end();
    }
}

run().catch(err => {
    console.error("FATAL ERROR:", err);
    process.exit(1);
});
