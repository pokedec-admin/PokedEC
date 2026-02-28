const express = require('express');
const { Pool } = require('pg');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const { authenticateToken, authenticateAdmin } = require('../middleware/auth');

// Create a separate pool for PROD database
let prodPool = null;

function getProdPool() {
    // Priority: Full DATABASE_URL > Component host/user/pass
    const connectionString = process.env.PROD_DATABASE_URL || process.env.PROD_DB_URL;

    if (!connectionString && !process.env.PROD_DB_HOST) {
        throw new Error('PROD_DATABASE_URL or PROD_DB_HOST environment variable is not set. Cannot connect to PROD database.');
    }

    if (!prodPool) {
        if (connectionString) {
            console.log(`🔌 Connecting to PROD DB via Connection String...`);
            prodPool = new Pool({
                connectionString: connectionString,
                ssl: process.env.PROD_DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
                connectionTimeoutMillis: 5000
            });
        } else {
            console.log(`🔌 Connecting to PROD DB at ${process.env.PROD_DB_HOST}:${process.env.PROD_DB_PORT || 5432}...`);
            prodPool = new Pool({
                user: process.env.PROD_DB_USER || process.env.DB_USER,
                host: process.env.PROD_DB_HOST,
                database: process.env.PROD_DB_NAME || process.env.DB_NAME,
                password: process.env.PROD_DB_PASSWORD || process.env.DB_PASSWORD,
                port: process.env.PROD_DB_PORT || process.env.DB_PORT || 5432,
                ssl: process.env.PROD_DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
                connectionTimeoutMillis: 5000
            });
        }
    }
    return prodPool;
}

// Universal Export Data Endpoint
router.get('/export-all', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const localPool = req.app.locals.pool;

        const users = (await localPool.query('SELECT * FROM trainers ORDER BY id')).rows;
        const pokedex = (await localPool.query('SELECT * FROM pokedex')).rows;
        const categories = (await localPool.query('SELECT * FROM pokemon_category_availability')).rows;
        const classifications = (await localPool.query('SELECT * FROM classifications')).rows;
        const regions = (await localPool.query('SELECT * FROM regions')).rows;
        const types = (await localPool.query('SELECT * FROM types')).rows;
        const master = (await localPool.query('SELECT * FROM pokemon_master')).rows;
        const suggestions = (await localPool.query('SELECT * FROM suggestions')).rows;

        res.json({
            trainers: users,
            pokedex: pokedex,
            pokemon_category_availability: categories,
            classifications: classifications,
            regions: regions,
            types: types,
            pokemon_master: master,
            suggestions: suggestions
        });
    } catch (error) {
        console.error('❌ Export error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Universal Import Data Endpoint
router.post('/import-all', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const localPool = req.app.locals.pool;
        const data = req.body;

        console.log('🔄 Starting full data import from JSON...');

        // Disable triggers/constraints temporarily if possible, or just clear and insert carefully
        await localPool.query('BEGIN');

        console.log('🗑️ Clearing existing data for universal sync...');
        await localPool.query('TRUNCATE TABLE pokedex CASCADE');
        await localPool.query('TRUNCATE TABLE trainers RESTART IDENTITY CASCADE');
        await localPool.query('TRUNCATE TABLE pokemon_category_availability CASCADE');
        await localPool.query('TRUNCATE TABLE pokemon_master CASCADE');
        await localPool.query('TRUNCATE TABLE classifications CASCADE');
        await localPool.query('TRUNCATE TABLE regions CASCADE');
        await localPool.query('TRUNCATE TABLE types CASCADE');
        await localPool.query('TRUNCATE TABLE suggestions RESTART IDENTITY CASCADE');

        // Reference Tables
        if (data.classifications) {
            for (const row of data.classifications) {
                await localPool.query('INSERT INTO classifications (id, name_fr, name_en, name_key, display_order) VALUES ($1,$2,$3,$4,$5)', [row.id, row.name_fr, row.name_en, row.name_key, row.display_order]);
            }
        }
        if (data.regions) {
            for (const row of data.regions) {
                await localPool.query('INSERT INTO regions (id, name_fr, name_en, name_key, display_order, is_custom) VALUES ($1,$2,$3,$4,$5,$6)', [row.id, row.name_fr, row.name_en, row.name_key, row.display_order, row.is_custom]);
            }
        }
        if (data.types) {
            for (const row of data.types) {
                await localPool.query('INSERT INTO types (id, name_fr, name_en, name_key, color_hex) VALUES ($1,$2,$3,$4,$5)', [row.id, row.name_fr, row.name_en, row.name_key, row.color_hex]);
            }
        }

        // IMPORT POKEMON_MASTER
        const master = data.pokemon_master;
        if (master && master.length > 0) {
            console.log(`📥 Global Sync: Importing ${master.length} pokemon_master entries...`);
            for (const row of master) {
                await localPool.query(`
                    INSERT INTO pokemon_master (
                        pokemon_id, form_name, name_fr, name_en, name_de, name_it, 
                        classification_id, region_id, type_primary_id, type_secondary_id,
                        is_available, trade_status, image_url, is_regional, 
                        regional_description, is_mega, is_gmax,
                        created_at, updated_at
                    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
                    ON CONFLICT (pokemon_id, form_name) DO UPDATE SET
                        name_fr = EXCLUDED.name_fr,
                        name_en = EXCLUDED.name_en,
                        is_available = EXCLUDED.is_available,
                        image_url = EXCLUDED.image_url,
                        updated_at = NOW()
                `, [
                    row.pokemon_id, row.form_name, row.name_fr, row.name_en, row.name_de, row.name_it,
                    row.classification_id, row.region_id, row.type_primary_id, row.type_secondary_id,
                    row.is_available, row.trade_status, row.image_url, row.is_regional,
                    row.regional_description || row.region_description, row.is_mega || false, row.is_gmax || false,
                    row.created_at || new Date(), row.updated_at || new Date()
                ]);
            }
        }

        // Trainers
        if (data.trainers) {
            for (const user of data.trainers) {
                await localPool.query(`
                    INSERT INTO trainers (id, email, trainer_name, password, is_admin, created_at, google_id, phone, preferred_language, campfire_name, whatsapp_group, email_verified, team, supabase_uid)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                `, [user.id, user.email, user.trainer_name, user.password, user.is_admin, user.created_at, user.google_id, user.phone, user.preferred_language, user.campfire_name, user.whatsapp_group, user.email_verified, user.team, user.supabase_uid]);
            }
        }

        // Suggestions
        if (data.suggestions) {
            for (const row of data.suggestions) {
                await localPool.query(`
                    INSERT INTO suggestions (
                        id, user_id, type, content, status, admin_response, 
                        created_at, updated_at, is_read, archived_user, archived_admin
                    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
                `, [row.id, row.user_id, row.type, row.content, row.status, row.admin_response,
                row.created_at, row.updated_at, row.is_read, row.archived_user, row.archived_admin]);
            }
        }

        // Category Availability
        if (data.pokemon_category_availability) {
            for (const cat of data.pokemon_category_availability) {
                await localPool.query(`
                    INSERT INTO pokemon_category_availability (
                        pokemon_id, form_name, can_be_normal, can_be_shiny, can_be_lucky, can_be_xxl, can_be_xxs,
                        can_be_gmax, can_be_dynamax, can_be_mega, can_be_obscure, can_be_purified, can_be_perfect,
                        can_be_legendary, can_be_mythical, can_be_ultra_beast
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
                `, [cat.pokemon_id, cat.form_name, cat.can_be_normal, cat.can_be_shiny, cat.can_be_lucky, cat.can_be_xxl, cat.can_be_xxs,
                cat.can_be_gmax, cat.can_be_dynamax, cat.can_be_mega, cat.can_be_obscure, cat.can_be_purified, cat.can_be_perfect,
                cat.can_be_legendary, cat.can_be_mythical, cat.can_be_ultra_beast]);
            }
        }

        // Pokedex
        if (data.pokedex) {
            for (const entry of data.pokedex) {
                await localPool.query(`
                    INSERT INTO pokedex (
                        user_id, pokemon_id, form_name, created_at,
                        has_normal, has_shiny, has_lucky,
                        has_xxl, has_xxs, has_gmax, has_dynamax, has_mega,
                        has_obscure, has_purifie, has_parfait, has_trade, trade_shiny,
                        trade_xxl, trade_xxs, trade_gmax, trade_dynamax,
                        trade_mega, trade_purified, trade_perfect
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
                `, [entry.user_id, entry.pokemon_id, entry.form_name, entry.created_at,
                entry.has_normal, entry.has_shiny, entry.has_lucky,
                entry.has_xxl, entry.has_xxs, entry.has_gmax, entry.has_dynamax, entry.has_mega,
                entry.has_obscure, entry.has_purifie, entry.has_parfait, entry.has_trade, entry.trade_shiny,
                entry.trade_xxl, entry.trade_xxs, entry.trade_gmax, entry.trade_dynamax,
                entry.trade_mega, entry.trade_purified, entry.trade_perfect]);
            }
        }

        await localPool.query('COMMIT');
        console.log('✅ Universal sync import completed.');

        res.json({
            success: true,
            message: 'Data imported successfully globally via JSON sync.',
            stats: {
                trainers: data.trainers?.length,
                pokedex: data.pokedex?.length,
                pokemon_master: data.pokemon_master?.length
            }
        });
    } catch (error) {
        if (req.app.locals.pool) await req.app.locals.pool.query('ROLLBACK');
        console.error('❌ Universal Import error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Legacy Import data from PROD to DEV
const syncAuthMiddleware = process.env.SKIP_SYNC_AUTH === 'true' ? (req, res, next) => next() : [authenticateToken, authenticateAdmin];
router.post('/import-prod-data', syncAuthMiddleware, async (req, res) => {
    // 🛡️ SECURITY: Disable this feature in real PRODUCTION environment (Render/NAS)
    // In local dev, we use APP_ENV=DEV even if NODE_ENV=production
    if (process.env.APP_ENV !== 'DEV') {
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

        // 0. Detect schema version (Table names)
        const tableCheck = await prodPool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name IN ('trainers', 'users')
        `);
        const tableNames = tableCheck.rows.map(r => r.table_name);
        const userTableName = tableNames.includes('trainers') ? 'trainers' : 'users';
        console.log(`  ℹ️  Detected user table: ${userTableName}`);

        // 1. Fetch all users from PROD
        console.log(`📥 Fetching users from PROD (table: ${userTableName})...`);
        const usersResult = await prodPool.query(`
            SELECT id, email, trainer_name, password, is_admin, created_at, google_id, phone, preferred_language, campfire_name, whatsapp_group, email_verified, team
            FROM ${userTableName}
            ORDER BY id
        `);
        const users = usersResult.rows;
        console.log(`  ✅ Fetched ${users.length} users`);

        // 2. Fetch all pokedex entries from PROD
        console.log('📥 Fetching pokedex from PROD...');
        // Detect pokedex columns for legacy mapping
        const pokedexColCheck = await prodPool.query(`
            SELECT column_name FROM information_schema.columns WHERE table_name = 'pokedex'
        `);
        const pokedexCols = pokedexColCheck.rows.map(r => r.column_name);
        const hasLegacyCols = pokedexCols.includes('has_legendary');

        let pokedexQuery = `
            SELECT user_id, pokemon_id, form_name, created_at,
                   has_normal, has_shiny, has_lucky, 
                   has_xxl, has_xxs, has_gmax, has_dynamax, has_mega, has_obscure,
                   has_purifie, has_parfait, has_trade, trade_shiny, 
                   trade_xxl, trade_xxs, trade_gmax, trade_dynamax,
                   trade_mega, trade_purified, trade_perfect
        `;

        if (hasLegacyCols) {
            console.log('  ℹ️  Legacy Pokedex columns detected (has_legendary, etc.). Mapping to has_normal...');
            pokedexQuery = `
                SELECT user_id, pokemon_id, form_name, created_at,
                       (has_normal OR has_legendary OR has_mythical OR has_ultra_beast) as has_normal,
                       has_shiny, has_lucky, 
                       has_xxl, has_xxs, has_gmax, has_dynamax, has_mega, has_obscure,
                       has_purifie, has_parfait, has_trade, trade_shiny, 
                       trade_xxl, trade_xxs, trade_gmax, trade_dynamax,
                       trade_mega, trade_purified, trade_perfect
            `;
        }

        const pokedexResult = await prodPool.query(`${pokedexQuery} FROM pokedex ORDER BY user_id, pokemon_id, form_name`);
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

        // Fetch suggestions and detect columns
        const suggestColCheck = await prodPool.query(`
            SELECT column_name FROM information_schema.columns WHERE table_name = 'suggestions'
        `);
        const suggestCols = suggestColCheck.rows.map(r => r.column_name);
        const hasSuggestionFields = suggestCols.includes('suggestion');
        const suggestContentCol = hasSuggestionFields ? 'suggestion' : 'content';
        const hasPokemonIdSuggest = suggestCols.includes('pokemon_id');

        let suggestQuery = `SELECT id, user_id, type, ${suggestContentCol} as content, status, admin_response, created_at, updated_at, is_read, archived_user, archived_admin`;
        if (hasPokemonIdSuggest) {
            suggestQuery += `, pokemon_id, form_name`;
        }
        const suggestions = (await prodPool.query(`${suggestQuery} FROM suggestions`)).rows;

        console.log(`  ✅ Fetched references: ${classifications.length} classes, ${regions.length} regions, ${types.length} types, ${master.length} master entries, ${suggestions.length} suggestions`);

        // 4. Clear local DEV data (DESTRUCTIVE!)
        console.log('🗑️   Clearing local DEV data...');
        // We use TRUNCATE for speed and fresh start
        await localPool.query('TRUNCATE TABLE pokedex CASCADE');
        await localPool.query('TRUNCATE TABLE trainers RESTART IDENTITY CASCADE');
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
        INSERT INTO trainers (id, email, trainer_name, password, is_admin, created_at, google_id, phone, preferred_language, campfire_name, whatsapp_group, email_verified, team)
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
        console.log('📤 Importing pokemon_master to DEV (without old can_be columns)...');
        for (const row of master) {
            await localPool.query(`
                INSERT INTO pokemon_master (
                    pokemon_id, form_name, name_fr, name_en, name_de, name_it, 
                    classification_id, region_id, type_primary_id, type_secondary_id,
                    is_available, trade_status, image_url, is_regional, 
                    regional_description, is_mega, is_gmax,
                    created_at, updated_at
                ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
            `, [
                row.pokemon_id, row.form_name, row.name_fr, row.name_en, row.name_de, row.name_it,
                row.classification_id, row.region_id, row.type_primary_id, row.type_secondary_id,
                row.is_available, row.trade_status, row.image_url, row.is_regional,
                row.regional_description || row.region_description, row.is_mega || false, row.is_gmax || false,
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

        // 8. Fix Dynamax images to use Normal form images
        console.log('🖼️  Fixing Dynamax images to use Normal form images...');
        await localPool.query(`
            UPDATE pokemon_master pm1 
            SET image_url = (
                SELECT image_url 
                FROM pokemon_master pm2 
                WHERE pm2.pokemon_id = pm1.pokemon_id AND pm2.form_name = 'Normal' 
                LIMIT 1
            ) 
            WHERE pm1.form_name = 'Dynamax'
        `);
        console.log('  ✅ Dynamax images aligned with Normal forms');

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

// NEW: Push local data to PROD (DANGEROUS - use with care!)
router.post('/push-local-to-prod', syncAuthMiddleware, async (req, res) => {
    try {
        const localPool = req.app.locals.pool;
        const prodPool = getProdPool();

        console.log('🚀 Starting PUSH DEV → PROD synchronization...');

        // 1. Fetch all local data
        console.log('📥 Fetching all local data...');
        const users = (await localPool.query('SELECT * FROM trainers ORDER BY id')).rows;
        const pokedex = (await localPool.query('SELECT * FROM pokedex ORDER BY user_id, pokemon_id, form_name')).rows;
        const categories = (await localPool.query('SELECT * FROM pokemon_category_availability ORDER BY pokemon_id, form_name')).rows;
        const classifications = (await localPool.query('SELECT * FROM classifications ORDER BY id')).rows;
        const regions = (await localPool.query('SELECT * FROM regions ORDER BY id')).rows;
        const types = (await localPool.query('SELECT * FROM types ORDER BY id')).rows;
        const master = (await localPool.query('SELECT * FROM pokemon_master ORDER BY pokemon_id, form_name')).rows;
        const suggestions = (await localPool.query('SELECT * FROM suggestions ORDER BY id')).rows;

        // 2. Clear PROD data (EXTREMELY DESTRUCTIVE!)
        console.log('🗑️   Clearing PROD data...');
        await prodPool.query('TRUNCATE TABLE pokedex CASCADE');

        // Detect user table on PROD
        const tableCheck = await prodPool.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('trainers', 'users')`);
        const userTableName = tableCheck.rows.map(r => r.table_name).includes('trainers') ? 'trainers' : 'users';
        await prodPool.query(`TRUNCATE TABLE ${userTableName} RESTART IDENTITY CASCADE`);

        await prodPool.query('TRUNCATE TABLE pokemon_category_availability CASCADE');
        await prodPool.query('TRUNCATE TABLE pokemon_master CASCADE');
        await prodPool.query('TRUNCATE TABLE classifications CASCADE');
        await prodPool.query('TRUNCATE TABLE regions CASCADE');
        await prodPool.query('TRUNCATE TABLE types CASCADE');
        await prodPool.query('TRUNCATE TABLE suggestions RESTART IDENTITY CASCADE');

        // 3. Import to PROD
        console.log(`📤 Pushing ${users.length} users to ${userTableName}...`);
        for (const u of users) {
            await prodPool.query(`
                INSERT INTO ${userTableName} (id, email, password, google_id, trainer_name, created_at, phone, email_verified, team, is_admin, preferred_language, campfire_name, whatsapp_group)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            `, [u.id, u.email, u.password, u.google_id, u.trainer_name, u.created_at, u.phone, u.email_verified, u.team, u.is_admin, u.preferred_language, u.campfire_name, u.whatsapp_group]);
        }

        console.log(`📤 Pushing reference tables...`);
        for (const row of classifications) await prodPool.query('INSERT INTO classifications (id, name_fr, name_en, name_key, display_order) VALUES ($1,$2,$3,$4,$5)', [row.id, row.name_fr, row.name_en, row.name_key, row.display_order]);
        for (const row of regions) await prodPool.query('INSERT INTO regions (id, name_fr, name_en, name_key, display_order, is_custom) VALUES ($1,$2,$3,$4,$5,$6)', [row.id, row.name_fr, row.name_en, row.name_key, row.display_order, row.is_custom]);
        for (const row of types) await prodPool.query('INSERT INTO types (id, name_fr, name_en, name_key, color_hex) VALUES ($1,$2,$3,$4,$5)', [row.id, row.name_fr, row.name_en, row.name_key, row.color_hex]);

        console.log(`📤 Pushing ${master.length} master entries...`);
        const masterColCheck = await prodPool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'pokemon_master'`);
        const prodMasterCols = masterColCheck.rows.map(r => r.column_name);
        const hasMega = prodMasterCols.includes('is_mega');
        const hasGmax = prodMasterCols.includes('is_gmax');

        for (const m of master) {
            let masterQuery = `
                INSERT INTO pokemon_master (pokemon_id, form_name, name_fr, name_en, name_de, name_it, classification_id, region_id, type_primary_id, type_secondary_id, is_available, trade_status, image_url, is_regional, regional_description`;
            let masterValues = [m.pokemon_id, m.form_name, m.name_fr, m.name_en, m.name_de, m.name_it, m.classification_id, m.region_id, m.type_primary_id, m.type_secondary_id, m.is_available, m.trade_status, m.image_url, m.is_regional, m.regional_description];
            let placeholders = `$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15`;

            let valIdx = 16;
            if (hasMega) {
                masterQuery += `, is_mega`;
                masterValues.push(m.is_mega || false);
                placeholders += `,$${valIdx++}`;
            }
            if (hasGmax) {
                masterQuery += `, is_gmax`;
                masterValues.push(m.is_gmax || false);
                placeholders += `,$${valIdx++}`;
            }

            masterQuery += `) VALUES (${placeholders})`;
            await prodPool.query(masterQuery, masterValues);
        }

        console.log(`📤 Pushing ${categories.length} category availability entries...`);
        for (const c of categories) {
            await prodPool.query(`
                INSERT INTO pokemon_category_availability (pokemon_id, form_name, can_be_normal, can_be_legendary, can_be_mythical, can_be_ultra_beast, can_be_shiny, can_be_lucky, can_be_xxl, can_be_xxs, can_be_gmax, can_be_dynamax, can_be_mega, can_be_obscure, can_be_purified, can_be_perfect)
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
            `, [c.pokemon_id, c.form_name, c.can_be_normal, c.can_be_legendary, c.can_be_mythical, c.can_be_ultra_beast, c.can_be_shiny, c.can_be_lucky, c.can_be_xxl, c.can_be_xxs, c.can_be_gmax, c.can_be_dynamax, c.can_be_mega, c.can_be_obscure, c.can_be_purified, c.can_be_perfect]);
        }

        console.log(`📤 Pushing ${pokedex.length} pokedex entries...`);
        // Detect pokedex columns for legacy mapping if PROD is old
        const pokedexColCheck = await prodPool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'pokedex'`);
        const prodPokedexCols = pokedexColCheck.rows.map(r => r.column_name);
        const hasLegacy = prodPokedexCols.includes('has_legendary');

        for (const p of pokedex) {
            if (hasLegacy) {
                await prodPool.query(`
                    INSERT INTO pokedex (user_id, pokemon_id, form_name, created_at, has_normal, has_shiny, has_lucky, has_xxl, has_xxs, has_gmax, has_dynamax, has_mega, has_obscure, has_purifie, has_parfait, has_trade)
                    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
                `, [p.user_id, p.pokemon_id, p.form_name, p.created_at, p.has_normal, p.has_shiny, p.has_lucky, p.has_xxl, p.has_xxs, p.has_gmax, p.has_dynamax, p.has_mega, p.has_obscure, p.has_purifie, p.has_parfait, p.has_trade]);
            } else {
                await prodPool.query(`
                    INSERT INTO pokedex (user_id, pokemon_id, form_name, created_at, has_normal, has_shiny, has_lucky, has_xxl, has_xxs, has_gmax, has_dynamax, has_mega, has_obscure, has_purifie, has_parfait, has_trade, trade_shiny, trade_xxl, trade_xxs, trade_gmax, trade_dynamax, trade_mega, trade_purified, trade_perfect)
                    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)
                `, [p.user_id, p.pokemon_id, p.form_name, p.created_at, p.has_normal, p.has_shiny, p.has_lucky, p.has_xxl, p.has_xxs, p.has_gmax, p.has_dynamax, p.has_mega, p.has_obscure, p.has_purifie, p.has_parfait, p.has_trade, p.trade_shiny, p.trade_xxl, p.trade_xxs, p.trade_gmax, p.trade_dynamax, p.trade_mega, p.trade_purified, p.trade_perfect]);
            }
        }

        console.log(`📤 Pushing ${suggestions.length} suggestions...`);
        for (const s of suggestions) {
            await prodPool.query(`
                INSERT INTO suggestions (id, user_id, type, content, status, admin_response, created_at, updated_at, is_read, archived_user, archived_admin)
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
            `, [s.id, s.user_id, s.type, s.content, s.status, s.admin_response, s.created_at, s.updated_at, s.is_read || false, s.archived_user || false, s.archived_admin || false]);
        }

        console.log('✅ PUSH DEV → PROD completed successfully!');
        res.json({ success: true, message: 'Données poussées vers PROD avec succès !' });
    } catch (error) {
        console.error('❌ Push error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
