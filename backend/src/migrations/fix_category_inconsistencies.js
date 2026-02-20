const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'db',
    database: process.env.DB_NAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

async function migrate() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log('Starting category consistency fix...');

        // 1. Fix Legendary
        // If pokemon CAN be legendary, and user has it as Normal, switch to Legendary
        await client.query(`
            UPDATE pokedex p
            SET has_legendary = true, has_normal = false, has_mythical = false, has_ultra_beast = false
            FROM pokemon_category_availability pca
            WHERE p.pokemon_id = pca.pokemon_id
            AND pca.can_be_legendary = true
            AND (p.has_normal = true OR p.has_mythical = true OR p.has_ultra_beast = true OR p.has_legendary = false)
        `);

        // 2. Fix Mythical
        await client.query(`
            UPDATE pokedex p
            SET has_mythical = true, has_normal = false, has_legendary = false, has_ultra_beast = false
            FROM pokemon_category_availability pca
            WHERE p.pokemon_id = pca.pokemon_id
            AND pca.can_be_mythical = true
            AND (p.has_normal = true OR p.has_legendary = true OR p.has_ultra_beast = true OR p.has_mythical = false)
        `);

        // 3. Fix Ultra Beast
        await client.query(`
            UPDATE pokedex p
            SET has_ultra_beast = true, has_normal = false, has_legendary = false, has_mythical = false
            FROM pokemon_category_availability pca
            WHERE p.pokemon_id = pca.pokemon_id
            AND pca.can_be_ultra_beast = true
            AND (p.has_normal = true OR p.has_legendary = true OR p.has_mythical = true OR p.has_ultra_beast = false)
        `);

        // 4. Fix Normal (default)
        // If pokemon CAN be normal (and NOT the others), ensure it's Normal
        await client.query(`
            UPDATE pokedex p
            SET has_normal = true, has_legendary = false, has_mythical = false, has_ultra_beast = false
            FROM pokemon_category_availability pca
            WHERE p.pokemon_id = pca.pokemon_id
            AND pca.can_be_normal = true 
            AND pca.can_be_legendary = false 
            AND pca.can_be_mythical = false 
            AND pca.can_be_ultra_beast = false
            AND (p.has_legendary = true OR p.has_mythical = true OR p.has_ultra_beast = true OR p.has_normal = false)
        `);

        await client.query('COMMIT');
        console.log('Category consistency fix completed successfully.');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
