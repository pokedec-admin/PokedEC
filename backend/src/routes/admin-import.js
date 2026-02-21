const express = require('express');
const { Pool } = require('pg');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const { authenticateToken, authenticateAdmin } = require('./auth');

// Create a separate pool for PROD database
let prodPool = null;

function getProdPool() {
    if (!process.env.PROD_DB_HOST) {
        throw new Error('PROD_DB_HOST environment variable is not set. Cannot connect to PROD database.');
    }

    if (!prodPool) {
        console.log(`🔌 Connecting to PROD DB at ${process.env.PROD_DB_HOST}:${process.env.PROD_DB_PORT || 5432}...`);
        prodPool = new Pool({
            user: process.env.PROD_DB_USER || process.env.DB_USER,
            host: process.env.PROD_DB_HOST,
            database: process.env.PROD_DB_NAME || process.env.DB_NAME,
            password: process.env.PROD_DB_PASSWORD || process.env.DB_PASSWORD,
            port: process.env.PROD_DB_PORT || process.env.DB_PORT || 5432,
            ssl: process.env.PROD_DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
            connectionTimeoutMillis: 5000 // Fail fast if connection is refused
        });
    }
    return prodPool;
}

// Import data from PROD to DEV
router.post('/import-prod-data', authenticateToken, authenticateAdmin, async (req, res) => {
    // 🛡️ SECURITY: Disable this feature in PRODUCTION environment
    if (process.env.NODE_ENV === 'production') {
        console.warn('⚠️ Attempt to use Import PROD in PRODUCTION environment blocked.');
        return res.status(403).json({
            error: 'Cette fonctionnalité est désactivée en environnement de PRODUCTION pour des raisons de sécurité.'
        });
    }

    try {
        const localPool = req.app.locals.pool;
        let prodPool;
        try {
            prodPool = getProdPool();
            // Test connection
            await prodPool.query('SELECT 1');
        } catch (connError) {
            console.error('❌ PROD DB Connection Error:', connError.message);
            return res.status(500).json({
                error: `Impossible de se connecter à la base PROD: ${connError.message}. Vérifiez PROD_DB_HOST.`
            });
        }

        console.log('🔄 Starting PROD → DEV data import...');

        // 1. Fetch all users from PROD
        console.log('📥 Fetching users from PROD...');
        const usersResult = await prodPool.query(`
      SELECT id, email, trainer_name, password, is_admin, created_at, google_id, phone, preferred_language, campfire_name, whatsapp_group, email_verified, team
      FROM users 
      ORDER BY id
    `);
        const users = usersResult.rows;
        console.log(`  ✅ Fetched ${users.length} users`);

        // 2. Fetch all pokedex entries from PROD
        console.log('📥 Fetching pokedex from PROD...');
        // Note: After migration 015, name fields and image_url no longer exist in pokedex
        // They are now only in pokemon_master
        const pokedexResult = await prodPool.query(`
      SELECT user_id, pokemon_id, form_name, created_at,
             has_normal, has_shiny, has_lucky, 
             has_xxl, has_xxs, has_gmax, has_dynamax, has_mega, has_obscure,
             has_purifie, has_parfait, has_trade, trade_shiny, 
             trade_xxl, trade_xxs, trade_gmax, trade_dynamax,
             trade_mega, trade_purified, trade_perfect
      FROM pokedex 
      ORDER BY user_id, pokemon_id, form_name
    `);
        const pokedex = pokedexResult.rows;
        console.log(`  ✅ Fetched ${pokedex.length} pokedex entries`);

        // 3. Fetch pokemon category availability from PROD
        console.log('📥 Fetching pokemon category availability from PROD...');
        const categoryResult = await prodPool.query(`
      SELECT pokemon_id, form_name, can_be_normal, can_be_legendary, can_be_mythical, can_be_ultra_beast,
             can_be_shiny, can_be_lucky, can_be_xxl, can_be_xxs, 
             can_be_gmax, can_be_dynamax, can_be_mega, can_be_obscure, can_be_purified, can_be_perfect
      FROM pokemon_category_availability
      ORDER BY pokemon_id, form_name
    `);
        const categories = categoryResult.rows;
        console.log(`  ✅ Fetched ${categories.length} category availability entries`);

        // 3b. Fetch reference tables and pokemon_master from PROD
        console.log('📥 Fetching reference tables from PROD...');
        const classifications = (await prodPool.query('SELECT * FROM classifications')).rows;
        const regions = (await prodPool.query('SELECT * FROM regions')).rows;
        const types = (await prodPool.query('SELECT * FROM types')).rows;
        const master = (await prodPool.query('SELECT * FROM pokemon_master')).rows;
        const suggestions = (await prodPool.query('SELECT * FROM suggestions')).rows;
        console.log(`  ✅ Fetched references: ${classifications.length} classes, ${regions.length} regions, ${types.length} types, ${master.length} master entries, ${suggestions.length} suggestions`);

        // 4. Clear local DEV data (DESTRUCTIVE!)
        console.log('🗑️   Clearing local DEV data...');
        await localPool.query('TRUNCATE TABLE pokedex CASCADE');
        await localPool.query('TRUNCATE TABLE users RESTART IDENTITY CASCADE');
        await localPool.query('TRUNCATE TABLE pokemon_category_availability CASCADE');
        await localPool.query('TRUNCATE TABLE pokemon_master CASCADE');
        await localPool.query('TRUNCATE TABLE classifications CASCADE');
        await localPool.query('TRUNCATE TABLE regions CASCADE');
        await localPool.query('TRUNCATE TABLE types CASCADE');
        await localPool.query('TRUNCATE TABLE suggestions RESTART IDENTITY CASCADE');
        console.log('  ✅ Local data cleared');

        // 5. Import users to DEV
        console.log('📤 Importing users to DEV...');
        for (const user of users) {
            await localPool.query(`
        INSERT INTO users (id, email, trainer_name, password, is_admin, created_at, google_id, phone, preferred_language, campfire_name, whatsapp_group, email_verified, team)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (id) DO UPDATE 
        SET email = EXCLUDED.email,
            trainer_name = EXCLUDED.trainer_name,
            password = EXCLUDED.password,
            is_admin = EXCLUDED.is_admin,
            created_at = EXCLUDED.created_at,
            google_id = EXCLUDED.google_id,
            phone = EXCLUDED.phone,
            preferred_language = EXCLUDED.preferred_language,
            campfire_name = EXCLUDED.campfire_name,
            whatsapp_group = EXCLUDED.whatsapp_group,
            email_verified = EXCLUDED.email_verified,
            team = EXCLUDED.team
      `, [user.id, user.email, user.trainer_name, user.password, user.is_admin, user.created_at, user.google_id, user.phone, user.preferred_language, user.campfire_name, user.whatsapp_group, user.email_verified, user.team]);
        }
        console.log(`  ✅ Imported ${users.length} users`);

        // 5b. Import reference tables to DEV
        console.log('📤 Importing reference tables to DEV...');
        for (const row of classifications) {
            await localPool.query('INSERT INTO classifications (id, name_fr, name_en, name_key, display_order) VALUES ($1,$2,$3,$4,$5)', [row.id, row.name_fr, row.name_en, row.name_key, row.display_order]);
        }
        for (const row of regions) {
            await localPool.query('INSERT INTO regions (id, name_fr, name_en, name_key, display_order, is_custom) VALUES ($1,$2,$3,$4,$5,$6)', [row.id, row.name_fr, row.name_en, row.name_key, row.display_order, row.is_custom]);
        }
        for (const row of types) {
            await localPool.query('INSERT INTO types (id, name_fr, name_en, name_key, color_hex) VALUES ($1,$2,$3,$4,$5)', [row.id, row.name_fr, row.name_en, row.name_key, row.color_hex]);
        }
        console.log('  ✅ Reference tables imported');

        // 5c. Import pokemon_master to DEV
        for (const row of master) {
            await localPool.query(`
                INSERT INTO pokemon_master (
                    pokemon_id, form_name, name_fr, name_en, name_de, name_it, 
                    classification_id, region_id, type_primary_id, type_secondary_id,
                    is_available, trade_status, image_url, is_regional, regional_description,
                    can_be_normal, can_be_shiny, can_be_lucky, can_be_xxl, can_be_xxs,
                    can_be_gmax, can_be_dynamax, can_be_mega, can_be_obscure, can_be_purified,
                    can_be_perfect, can_be_legendary, can_be_mythical, can_be_ultra_beast,
                    created_at, updated_at
                ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31)
            `, [
                row.pokemon_id, row.form_name, row.name_fr, row.name_en, row.name_de, row.name_it,
                row.classification_id, row.region_id, row.type_primary_id, row.type_secondary_id,
                row.is_available, row.trade_status, row.image_url, row.is_regional, row.regional_description,
                row.can_be_normal, row.can_be_shiny, row.can_be_lucky, row.can_be_xxl, row.can_be_xxs,
                row.can_be_gmax, row.can_be_dynamax, row.can_be_mega, row.can_be_obscure, row.can_be_purified,
                row.can_be_perfect, row.can_be_legendary, row.can_be_mythical, row.can_be_ultra_beast,
                row.created_at, row.updated_at
            ]);
        }
        console.log(`  ✅ Imported ${master.length} master entries`);

        // 5cc. Sync images from PROD
        console.log('🖼️  Syncing images from PROD...');
        const prodBaseUrl = process.env.PROD_APP_URL || 'https://www.pokedec.ch';
        const localImagesDir = path.join(__dirname, '../../../frontend/public/images/pokemon');

        if (!fs.existsSync(localImagesDir)) {
            fs.mkdirSync(localImagesDir, { recursive: true });
        }

        let syncedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        for (const row of master) {
            if (row.image_url && row.image_url.startsWith('/images/pokemon/')) {
                const fileName = path.basename(row.image_url);
                const localPath = path.join(localImagesDir, fileName);

                if (!fs.existsSync(localPath)) {
                    try {
                        const imageUrl = `${prodBaseUrl}${row.image_url}`;
                        console.log(`  📥 Downloading ${fileName} from PROD...`);

                        const response = await axios({
                            url: imageUrl,
                            method: 'GET',
                            responseType: 'stream',
                            timeout: 5000
                        });

                        const writer = fs.createWriteStream(localPath);
                        response.data.pipe(writer);

                        await new Promise((resolve, reject) => {
                            writer.on('finish', resolve);
                            writer.on('error', reject);
                        });

                        syncedCount++;
                    } catch (err) {
                        console.error(`  ❌ Failed to download ${row.image_url}:`, err.message);
                        errorCount++;
                    }
                } else {
                    skippedCount++;
                }
            }
        }
        console.log(`  ✅ Image sync completed: ${syncedCount} downloaded, ${skippedCount} skipped, ${errorCount} errors`);

        // 5d. Import suggestions to DEV
        console.log('📤 Importing suggestions to DEV...');
        for (const row of suggestions) {
            await localPool.query(`
                INSERT INTO suggestions (
                    id, user_id, type, content, status, admin_response, 
                    created_at, updated_at, is_read, archived_user, archived_admin
                ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
            `, [
                row.id, row.user_id, row.type, row.content, row.status, row.admin_response,
                row.created_at, row.updated_at, row.is_read || false,
                row.archived_user || false, row.archived_admin || false
            ]);
        }
        console.log(`  ✅ Imported ${suggestions.length} suggestions`);

        // 6. Import pokedex to DEV (without redundant name/image fields)
        console.log('📤 Importing pokedex to DEV...');
        for (const entry of pokedex) {
            try {
                await localPool.query(`
        INSERT INTO pokedex (
          user_id, pokemon_id, form_name, created_at,
          has_normal, has_shiny, has_lucky,
          has_xxl, has_xxs, has_gmax, has_dynamax, has_mega,
          has_obscure, has_purifie, has_parfait, has_trade, trade_shiny,
          trade_xxl, trade_xxs, trade_gmax, trade_dynamax,
          trade_mega, trade_purified, trade_perfect
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
        ON CONFLICT (user_id, pokemon_id, form_name) DO UPDATE 
        SET has_normal = EXCLUDED.has_normal,
            has_shiny = EXCLUDED.has_shiny,
            has_lucky = EXCLUDED.has_lucky,
            has_xxl = EXCLUDED.has_xxl,
            has_xxs = EXCLUDED.has_xxs,
            has_gmax = EXCLUDED.has_gmax,
            has_dynamax = EXCLUDED.has_dynamax,
            has_mega = EXCLUDED.has_mega,
            has_obscure = EXCLUDED.has_obscure,
            has_purifie = EXCLUDED.has_purifie,
            has_parfait = EXCLUDED.has_parfait,
            has_trade = EXCLUDED.has_trade,
            trade_shiny = EXCLUDED.trade_shiny,
            trade_xxl = EXCLUDED.trade_xxl,
            trade_xxs = EXCLUDED.trade_xxs,
            trade_gmax = EXCLUDED.trade_gmax,
            trade_dynamax = EXCLUDED.trade_dynamax,
            trade_mega = EXCLUDED.trade_mega,
            trade_purified = EXCLUDED.trade_purified,
            trade_perfect = EXCLUDED.trade_perfect
      `, [
                    entry.user_id, entry.pokemon_id, entry.form_name, entry.created_at,
                    entry.has_normal, entry.has_shiny, entry.has_lucky,
                    entry.has_xxl, entry.has_xxs, entry.has_gmax, entry.has_dynamax, entry.has_mega,
                    entry.has_obscure, entry.has_purifie, entry.has_parfait, entry.has_trade, entry.trade_shiny,
                    entry.trade_xxl, entry.trade_xxs, entry.trade_gmax, entry.trade_dynamax,
                    entry.trade_mega, entry.trade_purified, entry.trade_perfect
                ]);
            } catch (err) {
                console.error(`❌ Error importing pokedex entry for User ${entry.user_id} Pokemon ${entry.pokemon_id} (${entry.form_name}):`, err.message);
                // Continue to next entry instead of crashing
            }
        }
        console.log(`  ✅ Imported ${pokedex.length} pokedex entries`);


        // 7. Import pokemon category availability to DEV
        console.log('📤 Importing pokemon category availability to DEV...');

        // First, insert ALL Pokemon (1-1025) with default TRUE for all categories
        console.log('  📝 Creating default entries for all Pokemon...');
        for (let pokemonId = 1; pokemonId <= 1025; pokemonId++) {
            await localPool.query(`
                INSERT INTO pokemon_category_availability (
                    pokemon_id, form_name, can_be_normal, can_be_shiny, can_be_lucky, can_be_xxl, can_be_xxs,
                    can_be_gmax, can_be_dynamax, can_be_mega, can_be_obscure, can_be_purified, can_be_perfect
                )
                VALUES ($1, 'Normal', true, true, true, true, true, false, false, false, true, true, true)
                ON CONFLICT (pokemon_id, form_name) DO NOTHING
            `, [pokemonId]);
        }
        console.log('  ✅ Created default entries for 1025 Pokemon');

        // Then, update with actual PROD values for Pokemon that have explicit settings
        console.log('  📝 Updating with PROD-specific category settings...');
        for (const category of categories) {
            try {
                await localPool.query(`
        INSERT INTO pokemon_category_availability (
            pokemon_id, form_name, can_be_normal, can_be_shiny, can_be_lucky, can_be_xxl, can_be_xxs,
            can_be_gmax, can_be_dynamax, can_be_mega, can_be_obscure, can_be_purified, can_be_perfect,
            can_be_legendary, can_be_mythical, can_be_ultra_beast
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (pokemon_id, form_name) DO UPDATE SET
            can_be_normal = EXCLUDED.can_be_normal,
            can_be_legendary = EXCLUDED.can_be_legendary,
            can_be_mythical = EXCLUDED.can_be_mythical,
            can_be_ultra_beast = EXCLUDED.can_be_ultra_beast,
            can_be_shiny = EXCLUDED.can_be_shiny,
            can_be_lucky = EXCLUDED.can_be_lucky,
            can_be_xxl = EXCLUDED.can_be_xxl,
            can_be_xxs = EXCLUDED.can_be_xxs,
            can_be_gmax = EXCLUDED.can_be_gmax,
            can_be_dynamax = EXCLUDED.can_be_dynamax,
            can_be_mega = EXCLUDED.can_be_mega,
            can_be_obscure = EXCLUDED.can_be_obscure,
            can_be_purified = EXCLUDED.can_be_purified,
            can_be_perfect = EXCLUDED.can_be_perfect
      `, [
                    category.pokemon_id, category.form_name, category.can_be_normal, category.can_be_shiny,
                    category.can_be_lucky, category.can_be_xxl, category.can_be_xxs,
                    category.can_be_gmax, category.can_be_dynamax, category.can_be_mega, category.can_be_obscure,
                    category.can_be_purified, category.can_be_perfect,
                    category.can_be_legendary, category.can_be_mythical, category.can_be_ultra_beast
                ]);
            } catch (err) {
                console.error(`❌ Error updating category availability for Pokemon ${category.pokemon_id} (${category.form_name}):`, err.message);
            }
        }
        console.log(`  ✅ Updated ${categories.length} Pokemon with PROD-specific settings`);

        console.log('✅ PROD → DEV import completed successfully!');

        res.json({
            success: true,
            message: 'Data imported successfully',
            stats: {
                users: users.length,
                pokedex: pokedex.length,
                categories: categories.length,
                classifications: classifications.length,
                regions: regions.length,
                types: types.length,
                suggestions: suggestions.length,
                pokemon_master: master.length,
                images: {
                    synced: syncedCount,
                    skipped: skippedCount,
                    errors: errorCount
                }
            }
        });

    } catch (error) {
        console.error('❌ Import error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
