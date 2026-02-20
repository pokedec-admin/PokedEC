const { Pool } = require('../backend/node_modules/pg');
const axios = require('../backend/node_modules/axios').default;
const fs = require('fs');
const path = require('path');
const https = require('https');

// DB Connection
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: 'postgres',
    port: 5434,
});

const IMAGE_DIR = path.join(__dirname, '../frontend/public/images/pokemon');

function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);
        https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(filepath, () => { });
            reject(err);
        });
    });
}

async function downloadImages() {
    if (!fs.existsSync(IMAGE_DIR)) {
        fs.mkdirSync(IMAGE_DIR, { recursive: true });
    }

    const client = await pool.connect();
    try {
        const res = await client.query(`
      SELECT pokemon_id, form_name, image_url 
      FROM pokemon_master 
      WHERE image_url IS NOT NULL 
      AND image_url LIKE 'http%'
    `);

        console.log(`🚀 Found ${res.rows.length} images to download...`);

        for (const row of res.rows) {
            const fileName = `${row.pokemon_id}_${row.form_name.replace(/ /g, '_')}.png`;
            const filePath = path.join(IMAGE_DIR, fileName);
            const localUrl = `/images/pokemon/${fileName}`;

            try {
                console.log(`📥 Downloading ${row.image_url} -> ${fileName}`);
                await downloadImage(row.image_url, filePath);

                // Update DB
                await client.query(
                    'UPDATE pokemon_master SET image_url = $1 WHERE pokemon_id = $2 AND form_name = $3',
                    [localUrl, row.pokemon_id, row.form_name]
                );
                console.log(`✅ ${fileName} downloaded and DB updated`);

            } catch (err) {
                console.error(`❌ Failed to download ${fileName}:`, err.message);
            }
        }

        console.log('✅ All images internalized!');
    } finally {
        client.release();
        pool.end();
    }
}

downloadImages();
