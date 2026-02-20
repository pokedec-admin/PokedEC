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

        console.log('Starting availability population from Pokedex...');

        // 1. Set can_be_legendary if ANY user has has_legendary=true
        const legendaryResult = await client.query(`
            UPDATE pokemon_category_availability pca
            SET can_be_legendary = true, can_be_normal = false
            WHERE pokemon_id IN (
                SELECT DISTINCT pokemon_id FROM pokedex WHERE has_legendary = true
            )
        `);
        console.log(`Updated ${legendaryResult.rowCount} Pokemon to be Legendary`);

        // 2. Set can_be_mythical if ANY user has has_mythical=true
        const mythicalResult = await client.query(`
            UPDATE pokemon_category_availability pca
            SET can_be_mythical = true, can_be_normal = false
            WHERE pokemon_id IN (
                SELECT DISTINCT pokemon_id FROM pokedex WHERE has_mythical = true
            )
        `);
        console.log(`Updated ${mythicalResult.rowCount} Pokemon to be Mythical`);

        // 3. Set can_be_ultra_beast if ANY user has has_ultra_beast=true
        const ubResult = await client.query(`
            UPDATE pokemon_category_availability pca
            SET can_be_ultra_beast = true, can_be_normal = false
            WHERE pokemon_id IN (
                SELECT DISTINCT pokemon_id FROM pokedex WHERE has_ultra_beast = true
            )
        `);
        console.log(`Updated ${ubResult.rowCount} Pokemon to be Ultra Beast`);

        await client.query('COMMIT');
        console.log('Availability population completed successfully.');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
