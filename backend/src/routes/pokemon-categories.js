const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const poolConfig = process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    }
    : {
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'db',
        database: process.env.DB_NAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        port: process.env.DB_PORT || 5432,
    };

const pool = new Pool(poolConfig);

const { authenticateAdmin } = require('./auth');

// Get all pokemon with their category availability (paginated)
router.get('/', authenticateAdmin, async (req, res) => {
    const { page = 1, limit = 50, search = '' } = req.query;
    const offset = (page - 1) * limit;

    try {
        // Get total count
        const countResult = await pool.query(
            'SELECT COUNT(*) FROM generate_series(1, 1025) AS pokemon_id'
        );
        const total = parseInt(countResult.rows[0].count);

        // Get pokemon with their availability settings
        // For pokemon not in the table, use default values
        const result = await pool.query(
            `SELECT 
                gs.pokemon_id,
                'Normal' as form_name,
            COALESCE(pca.can_be_normal, true) as can_be_normal,
            COALESCE(pca.can_be_legendary, false) as can_be_legendary,
            COALESCE(pca.can_be_mythical, false) as can_be_mythical,
            COALESCE(pca.can_be_ultra_beast, false) as can_be_ultra_beast,
            COALESCE(pca.can_be_shiny, false) as can_be_shiny,
            COALESCE(pca.can_be_lucky, true) as can_be_lucky,
            COALESCE(pca.can_be_xxl, true) as can_be_xxl,
            COALESCE(pca.can_be_xxs, true) as can_be_xxs,
            false as can_be_gmax,
            false as can_be_dynamax,
            false as can_be_mega,
            COALESCE(pca.can_be_obscure, false) as can_be_obscure,
            COALESCE(pca.can_be_purified, false) as can_be_purified,
            COALESCE(pca.can_be_perfect, true) as can_be_perfect,
            pca.updated_at,
            u.trainer_name as updated_by_name
             FROM generate_series(1, 1025) AS gs(pokemon_id)
             LEFT JOIN pokemon_category_availability pca ON gs.pokemon_id = pca.pokemon_id AND pca.form_name = 'Normal'
             LEFT JOIN users u ON pca.updated_by = u.id
             WHERE CAST(gs.pokemon_id AS TEXT) LIKE $1
             ORDER BY gs.pokemon_id
             LIMIT $2 OFFSET $3`,
            [`%${search}%`, limit, offset]
        );

        res.json({
            data: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get category availability for a specific pokemon
router.get('/:pokemon_id', authenticateAdmin, async (req, res) => {
    const { pokemon_id } = req.params;

    if (pokemon_id < 1 || pokemon_id > 1025) {
        return res.status(400).json({ error: 'Invalid Pokemon ID (must be 1-1025)' });
    }

    try {
        const result = await pool.query(
            `SELECT 
                $1 as pokemon_id,
            COALESCE(pca.can_be_normal, true) as can_be_normal,
            COALESCE(pca.can_be_legendary, false) as can_be_legendary,
            COALESCE(pca.can_be_mythical, false) as can_be_mythical,
            COALESCE(pca.can_be_ultra_beast, false) as can_be_ultra_beast,
            COALESCE(pca.can_be_shiny, false) as can_be_shiny,
            COALESCE(pca.can_be_lucky, true) as can_be_lucky,
            COALESCE(pca.can_be_xxl, true) as can_be_xxl,
            COALESCE(pca.can_be_xxs, true) as can_be_xxs,
            COALESCE(pca.can_be_gmax, false) as can_be_gmax,
            COALESCE(pca.can_be_dynamax, false) as can_be_dynamax,
            COALESCE(pca.can_be_mega, false) as can_be_mega,
            COALESCE(pca.can_be_obscure, false) as can_be_obscure,
            COALESCE(pca.can_be_purified, false) as can_be_purified,
            COALESCE(pca.can_be_perfect, true) as can_be_perfect
             FROM(SELECT 1) AS dummy
             LEFT JOIN pokemon_category_availability pca ON pca.pokemon_id = $1`,
            [pokemon_id]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update category availability for a specific pokemon
router.put('/:pokemon_id', authenticateAdmin, async (req, res) => {
    const { pokemon_id } = req.params;
    const {
        can_be_normal,
        can_be_legendary,
        can_be_mythical,
        can_be_ultra_beast,
        can_be_shiny,
        can_be_lucky,
        can_be_xxl,
        can_be_xxs,
        can_be_gmax,
        can_be_dynamax,
        can_be_mega,
        can_be_obscure,
        can_be_purified,
        can_be_perfect
    } = req.body;

    if (pokemon_id < 1 || pokemon_id > 1025) {
        return res.status(400).json({ error: 'Invalid Pokemon ID (must be 1-1025)' });
    }

    try {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Update availability
            // 1. Update availability
            const result = await client.query(
                `INSERT INTO pokemon_category_availability(
                    pokemon_id, form_name, can_be_normal, can_be_legendary, can_be_mythical, can_be_ultra_beast,
                    can_be_shiny, can_be_lucky, can_be_xxl, can_be_xxs,
                    can_be_gmax, can_be_dynamax, can_be_mega, can_be_obscure, can_be_purified, can_be_perfect,
                    updated_by, updated_at
                ) VALUES($1, 'Normal', $2, $3, $4, $5, $6, $7, $8, $9, false, false, false, $13, $14, $15, $16, CURRENT_TIMESTAMP)
                ON CONFLICT(pokemon_id, form_name) 
                DO UPDATE SET
                    can_be_normal = EXCLUDED.can_be_normal,
                    can_be_legendary = EXCLUDED.can_be_legendary,
                    can_be_mythical = EXCLUDED.can_be_mythical,
                    can_be_ultra_beast = EXCLUDED.can_be_ultra_beast,
                    can_be_shiny = EXCLUDED.can_be_shiny,
                    can_be_lucky = EXCLUDED.can_be_lucky,
                    can_be_xxl = EXCLUDED.can_be_xxl,
                    can_be_xxs = EXCLUDED.can_be_xxs,
                    can_be_gmax = false,
                    can_be_dynamax = false,
                    can_be_mega = false,
                    can_be_obscure = EXCLUDED.can_be_obscure,
                    can_be_purified = EXCLUDED.can_be_purified,
                    can_be_perfect = EXCLUDED.can_be_perfect,
                    updated_by = EXCLUDED.updated_by,
                    updated_at = CURRENT_TIMESTAMP
                RETURNING *`,
                [
                    pokemon_id, can_be_normal, can_be_legendary, can_be_mythical, can_be_ultra_beast,
                    can_be_shiny, can_be_lucky, can_be_xxl, can_be_xxs,
                    can_be_gmax, can_be_dynamax, can_be_mega, can_be_obscure, can_be_purified, can_be_perfect,
                    req.user.id
                ]
            );

            // 2. Propagate changes to existing user data in pokedex
            // If the pokemon is collected (has_normal OR has_legendary OR has_mythical OR has_ultra_beast),
            // move it to the new valid category.

            let targetCategory = null;
            if (can_be_legendary) targetCategory = 'has_legendary';
            else if (can_be_mythical) targetCategory = 'has_mythical';
            else if (can_be_ultra_beast) targetCategory = 'has_ultra_beast';
            else if (can_be_normal) targetCategory = 'has_normal';

            if (targetCategory) {
                // Set the target category to true AND others to false
                // ONLY for rows where the pokemon is already collected (has any of the 4 flags true)
                await client.query(
                    `UPDATE pokedex
                     SET 
                        has_normal = CASE WHEN $1 = 'has_normal' THEN true ELSE false END,
                        has_legendary = CASE WHEN $1 = 'has_legendary' THEN true ELSE false END,
                        has_mythical = CASE WHEN $1 = 'has_mythical' THEN true ELSE false END,
                        has_ultra_beast = CASE WHEN $1 = 'has_ultra_beast' THEN true ELSE false END
                     WHERE pokemon_id = $2
                     AND (has_normal = true OR has_legendary = true OR has_mythical = true OR has_ultra_beast = true)`,
                    [targetCategory, pokemon_id]
                );
            }

            await client.query('COMMIT');
            res.json(result.rows[0]);
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Batch update multiple pokemon
router.post('/batch', authenticateAdmin, async (req, res) => {
    const { updates } = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
        return res.status(400).json({ error: 'Updates must be a non-empty array' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        for (const update of updates) {
            const {
                pokemon_id,
                can_be_normal,
                can_be_legendary,
                can_be_mythical,
                can_be_ultra_beast,
                can_be_shiny,
                can_be_lucky,
                can_be_xxl,
                can_be_xxs,
                can_be_gmax,
                can_be_dynamax,
                can_be_mega,
                can_be_obscure,
                can_be_purified,
                can_be_perfect
            } = update;

            if (pokemon_id < 1 || pokemon_id > 1025) {
                throw new Error(`Invalid Pokemon ID: ${pokemon_id}`);
            }

            await client.query(
                `INSERT INTO pokemon_category_availability(
                pokemon_id, form_name, can_be_normal, can_be_legendary, can_be_mythical, can_be_ultra_beast,
                can_be_shiny, can_be_lucky, can_be_xxl, can_be_xxs,
                can_be_gmax, can_be_dynamax, can_be_mega, can_be_obscure, can_be_purified, can_be_perfect,
                updated_by, updated_at
            ) VALUES($1, 'Normal', $3, $4, $5, $6, $7, $8, $9, $10, false, false, false, $14, $15, $16, $17, CURRENT_TIMESTAMP)
                ON CONFLICT(pokemon_id, form_name) 
                DO UPDATE SET
                    can_be_normal = EXCLUDED.can_be_normal,
                    can_be_legendary = EXCLUDED.can_be_legendary,
                    can_be_mythical = EXCLUDED.can_be_mythical,
                    can_be_ultra_beast = EXCLUDED.can_be_ultra_beast,
                    can_be_shiny = EXCLUDED.can_be_shiny,
                    can_be_lucky = EXCLUDED.can_be_lucky,
                    can_be_xxl = EXCLUDED.can_be_xxl,
                    can_be_xxs = EXCLUDED.can_be_xxs,
                    can_be_gmax = false,
                    can_be_dynamax = false,
                    can_be_mega = false,
                    can_be_obscure = EXCLUDED.can_be_obscure,
                    can_be_purified = EXCLUDED.can_be_purified,
                    can_be_perfect = EXCLUDED.can_be_perfect,
                    updated_by = EXCLUDED.updated_by,
                    updated_at = CURRENT_TIMESTAMP`,
                [
                    pokemon_id, 'Normal', can_be_normal, can_be_legendary, can_be_mythical, can_be_ultra_beast,
                    can_be_shiny, can_be_lucky, can_be_xxl, can_be_xxs,
                    can_be_gmax, can_be_dynamax, can_be_mega, can_be_obscure, can_be_purified, can_be_perfect,
                    req.user.id
                ]
            );
        }

        await client.query('COMMIT');
        res.json({ message: `Successfully updated ${updates.length} pokemon`, count: updates.length });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: err.message || 'Server error' });
    } finally {
        client.release();
    }
});

module.exports = router;
