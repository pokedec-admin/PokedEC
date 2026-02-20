const { Pool } = require('pg');

// Local DB Pool
const localPool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'db',
    database: process.env.DB_NAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

// PROD DB Pool
function getProdPool() {
    if (!process.env.PROD_DB_HOST) {
        throw new Error('PROD_DB_HOST environment variable is not set.');
    }
    console.log(`🔌 Connecting to PROD DB at ${process.env.PROD_DB_HOST}:${process.env.PROD_DB_PORT || 5432}...`);
    return new Pool({
        user: process.env.PROD_DB_USER || process.env.DB_USER,
        host: process.env.PROD_DB_HOST,
        database: process.env.PROD_DB_NAME || process.env.DB_NAME,
        password: process.env.PROD_DB_PASSWORD || process.env.DB_PASSWORD,
        port: process.env.PROD_DB_PORT || process.env.DB_PORT || 5432,
        ssl: process.env.PROD_DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
        connectionTimeoutMillis: 5000
    });
}

async function runImport() {
    const prodPool = getProdPool();

    try {
        // Test connection
        await prodPool.query('SELECT 1');
        console.log('✅ Connected to PROD DB');

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
        const pokedexResult = await prodPool.query(`
      SELECT user_id, pokemon_id, name, name_fr, name_en, name_de, name_it, name_pt, image_url, created_at,
             has_normal, has_shiny, has_lucky, 
             has_xxl, has_xxs, has_gmax, has_mega, has_obscure,
             has_purifie, has_parfait, has_trade, trade_shiny, 
             trade_xxl, trade_xxs, trade_gmax, 
             trade_mega, trade_purified, trade_perfect
      FROM pokedex 
      ORDER BY user_id, pokemon_id
    `);
        const pokedex = pokedexResult.rows;
        console.log(`  ✅ Fetched ${pokedex.length} pokedex entries`);

        // 3. Fetch pokemon category availability from PROD
        console.log('📥 Fetching pokemon category availability from PROD...');
        const categoryResult = await prodPool.query(`
      SELECT pokemon_id, can_be_normal, can_be_shiny, can_be_lucky, can_be_xxl, can_be_xxs, 
             can_be_gmax, can_be_mega, can_be_obscure, can_be_purified, can_be_perfect
      FROM pokemon_category_availability
      ORDER BY pokemon_id
    `);
        const categories = categoryResult.rows;
        console.log(`  ✅ Fetched ${categories.length} category availability entries`);

        // 4. Clear local DEV data
        console.log('🗑️  Clearing local DEV data...');
        await localPool.query('TRUNCATE TABLE pokedex CASCADE');
        await localPool.query('TRUNCATE TABLE users RESTART IDENTITY CASCADE');
        await localPool.query('TRUNCATE TABLE pokemon_category_availability CASCADE');
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

        // 6. Import pokedex to DEV
        console.log('📤 Importing pokedex to DEV...');
        for (const entry of pokedex) {
            try {
                await localPool.query(`
        INSERT INTO pokedex (
          user_id, pokemon_id, name, name_fr, name_en, name_de, name_it, name_pt, image_url, created_at,
          has_normal, has_shiny, has_lucky,
          has_xxl, has_xxs, has_gmax, has_dynamax, has_mega,
          has_obscure, has_purifie, has_parfait, has_trade, trade_shiny,
          trade_xxl, trade_xxs, trade_gmax, trade_dynamax,
          trade_mega, trade_purified, trade_perfect
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30)
        ON CONFLICT (user_id, pokemon_id) DO UPDATE 
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
                    entry.user_id, entry.pokemon_id, entry.name, entry.name_fr, entry.name_en, entry.name_de, entry.name_it, entry.name_pt, entry.image_url, entry.created_at,
                    entry.has_normal, entry.has_shiny, entry.has_lucky,
                    entry.has_xxl, entry.has_xxs, entry.has_gmax, entry.has_dynamax || false, entry.has_mega,
                    entry.has_obscure, entry.has_purifie, entry.has_parfait, entry.has_trade, entry.trade_shiny,
                    entry.trade_xxl, entry.trade_xxs, entry.trade_gmax, entry.trade_dynamax || false,
                    entry.trade_mega, entry.trade_purified, entry.trade_perfect
                ]);
            } catch (err) {
                console.error(`❌ Error importing pokedex entry for User ${entry.user_id} Pokemon ${entry.pokemon_id}:`, err.message);
            }
        }
        console.log(`  ✅ Imported ${pokedex.length} pokedex entries`);

        // 7. Import pokemon category availability to DEV
        console.log('📤 Importing pokemon category availability to DEV...');

        console.log('  📝 Creating default entries for all Pokemon...');
        for (let pokemonId = 1; pokemonId <= 1025; pokemonId++) {
            await localPool.query(`
                INSERT INTO pokemon_category_availability (
                    pokemon_id, can_be_normal, can_be_legendary, can_be_mythical, can_be_ultra_beast,
                    can_be_shiny, can_be_lucky, can_be_xxl, can_be_xxs,
                    can_be_gmax, can_be_dynamax, can_be_mega, can_be_obscure, can_be_purified, can_be_perfect
                )
                VALUES ($1, true, false, false, false, true, true, true, true, false, false, false, true, true, true)
                ON CONFLICT (pokemon_id) DO NOTHING
            `, [pokemonId]);
        }
        console.log('  ✅ Created default entries for 1025 Pokemon');

        console.log('  📝 Updating with PROD-specific category settings...');
        for (const category of categories) {
            try {
                await localPool.query(`
        UPDATE pokemon_category_availability
        SET can_be_normal = $2,
            can_be_shiny = $3,
            can_be_lucky = $4,
            can_be_xxl = $5,
            can_be_xxs = $6,
            can_be_gmax = $7,
            can_be_dynamax = $8,
            can_be_mega = $9,
            can_be_obscure = $10,
            can_be_purified = $11,
            can_be_perfect = $12
        WHERE pokemon_id = $1
      `, [
                    category.pokemon_id, category.can_be_normal, category.can_be_shiny,
                    category.can_be_lucky, category.can_be_xxl, category.can_be_xxs,
                    category.can_be_gmax, false, category.can_be_mega, category.can_be_obscure,
                    category.can_be_purified, category.can_be_perfect
                ]);
            } catch (err) {
                console.error(`❌ Error updating category availability for Pokemon ${category.pokemon_id}:`, err.message);
            }
        }
        console.log(`  ✅ Updated ${categories.length} Pokemon with PROD-specific settings`);

        console.log('✅ PROD → DEV import completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Import error:', error);
        process.exit(1);
    }
}

runImport();
