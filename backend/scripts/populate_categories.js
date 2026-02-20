const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'db',
    database: process.env.DB_NAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

const LEGENDARY_IDS = [
    144, 145, 146, 150, 243, 244, 245, 249, 250, 377, 378, 379, 380, 381, 382, 383, 384,
    480, 481, 482, 483, 484, 485, 486, 487, 488, 638, 639, 640, 641, 642, 643, 644, 645, 646,
    716, 717, 718, 785, 786, 787, 788, 789, 790, 791, 792, 800, 888, 889, 890, 891, 892,
    894, 895, 896, 897, 898, 905, 1001, 1002, 1003, 1004, 1007, 1008, 1014, 1015, 1016, 1017, 1024
];

const MYTHICAL_IDS = [
    151, 251, 385, 386, 489, 490, 491, 492, 493, 494, 647, 648, 649, 719, 720, 721,
    801, 802, 807, 808, 809, 893, 1025
];

const ULTRA_BEAST_IDS = [
    793, 794, 795, 796, 797, 798, 799, 803, 804, 805, 806
];

async function populate() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log('Starting category population...');

        // 1. Legendary
        if (LEGENDARY_IDS.length > 0) {
            const res = await client.query(`
                UPDATE pokemon_category_availability
                SET can_be_legendary = true, can_be_normal = false
                WHERE pokemon_id = ANY($1)
            `, [LEGENDARY_IDS]);
            console.log(`Updated ${res.rowCount} Legendary Pokemon`);
        }

        // 2. Mythical
        if (MYTHICAL_IDS.length > 0) {
            const res = await client.query(`
                UPDATE pokemon_category_availability
                SET can_be_mythical = true, can_be_normal = false
                WHERE pokemon_id = ANY($1)
            `, [MYTHICAL_IDS]);
            console.log(`Updated ${res.rowCount} Mythical Pokemon`);
        }

        // 3. Ultra Beast
        if (ULTRA_BEAST_IDS.length > 0) {
            const res = await client.query(`
                UPDATE pokemon_category_availability
                SET can_be_ultra_beast = true, can_be_normal = false
                WHERE pokemon_id = ANY($1)
            `, [ULTRA_BEAST_IDS]);
            console.log(`Updated ${res.rowCount} Ultra Beast Pokemon`);
        }

        await client.query('COMMIT');
        console.log('Category population completed successfully.');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Population failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

populate();
