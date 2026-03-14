const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const Joi = require('joi');
const { validateBody } = require('../middleware/validation');
const redis = require('../config/redis');
const logger = require('../utils/logger');


// Pool is obtained from app.locals (set up in index.js) to ensure correct DB per environment
const getPool = (req) => req.app.locals.pool;


// Get user's pokedex
router.get('/', authenticateToken, async (req, res) => {
    const pool = getPool(req);
    try {
        const pool = getPool(req);
        const result = await pool.query(`
            SELECT 
                p.*,
                pm.name_fr as name,
                pm.name_fr, pm.name_en, pm.name_de, pm.name_it,
                pm.image_url,
                pm.classification_id, pm.region_id, 
                pm.type_primary_id, pm.type_secondary_id,
                pm.trade_status as master_trade_status,
                pm.is_regional, pm.regional_description,
                c.name_fr as classification_name,
                c.name_key as classification_key,
                r.name_fr as region_name,
                r.name_key as region_key,
                t1.name_fr as type_primary_name, 
                t1.name_key as type_primary_key,
                t1.color_hex as type_primary_color,
                t2.name_fr as type_secondary_name,
                t2.name_key as type_secondary_key,
                t2.color_hex as type_secondary_color,
            COALESCE(pca.can_be_normal, true) as can_be_normal,
            COALESCE(pca.can_be_legendary, false) as can_be_legendary,
            COALESCE(pca.can_be_mythical, false) as can_be_mythical,
            COALESCE(pca.can_be_ultra_beast, false) as can_be_ultra_beast,
            COALESCE(pca.can_be_shiny, true) as can_be_shiny,
            COALESCE(pca.can_be_lucky, true) as can_be_lucky,
            COALESCE(pca.can_be_xxl, true) as can_be_xxl,
            COALESCE(pca.can_be_xxs, true) as can_be_xxs,
            COALESCE(pca.can_be_gmax, false) as can_be_gmax,
            COALESCE(pca.can_be_dynamax, false) as can_be_dynamax,
            COALESCE(pca.can_be_mega, false) as can_be_mega,
            COALESCE(pca.can_be_obscure, false) as can_be_obscure,
            COALESCE(pca.can_be_purified, false) as can_be_purified,
            COALESCE(pca.can_be_perfect, true) as can_be_perfect
            FROM pokedex p
            INNER JOIN pokemon_master pm ON p.pokemon_id = pm.pokemon_id AND p.form_name = pm.form_name
            LEFT JOIN classifications c ON pm.classification_id = c.id
            LEFT JOIN regions r ON pm.region_id = r.id
            LEFT JOIN types t1 ON pm.type_primary_id = t1.id
            LEFT JOIN types t2 ON pm.type_secondary_id = t2.id
            LEFT JOIN pokemon_category_availability pca ON p.pokemon_id = pca.pokemon_id AND p.form_name = pca.form_name
            WHERE p.user_id = $1 AND pm.is_available = true
            ORDER BY p.pokemon_id ASC, p.form_name ASC
        `, [req.user.id]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all Pokémon master data with Redis caching
router.get('/master-all', authenticateToken, async (req, res) => {
    const cacheKey = 'pokemon:master:all';
    
    try {
        // Try to get from cache
        const cachedData = await redis.get(cacheKey);
        if (cachedData) {
            logger.info(`[Cache] Hit for ${cacheKey}`);
            return res.json(JSON.parse(cachedData));
        }

        logger.info(`[Cache] Miss for ${cacheKey}. Fetching from DB.`);
        const pool = getPool(req);
        const result = await pool.query(`
            SELECT 
                pm.pokemon_id, pm.form_name, pm.name_fr, pm.name_en, pm.name_de, pm.name_it,
                COALESCE(pm.image_url, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/' || pm.pokemon_id || '.png') as image_url,
                pm.classification_id, pm.region_id,
                pm.is_regional, pm.regional_description,
                r.name_fr as region_name, r.name_key as region_key,
                c.name_fr as classification_name, c.name_key as classification_key,
                t1.name_fr as type_primary_name,
                t1.name_key as type_primary_key,
                t1.color_hex as type_primary_color,
                t2.name_fr as type_secondary_name,
                t2.name_key as type_secondary_key,
                t2.color_hex as type_secondary_color
            FROM pokemon_master pm
            LEFT JOIN regions r ON pm.region_id = r.id
            LEFT JOIN classifications c ON pm.classification_id = c.id
            LEFT JOIN types t1 ON pm.type_primary_id = t1.id
            LEFT JOIN types t2 ON pm.type_secondary_id = t2.id
            WHERE pm.is_available = true
            ORDER BY pm.pokemon_id ASC, pm.form_name ASC
        `);
        
        // Cache the result for 24 hours
        await redis.setex(cacheKey, 86400, JSON.stringify(result.rows));
        
        res.json(result.rows);
    } catch (err) {
        logger.error(`[API/Pokedex] master-all error: ${err.message}`, { stack: err.stack });
        res.status(500).json({ error: 'Server error' });
    }
});

// Helper route for tracking a specific category (including missing ones)
router.get('/tracking/:category', authenticateToken, async (req, res) => {
    const { category } = req.params;
    console.log('[API] Tracking request for category:', category);
    try {
        const pool = getPool(req);
        let condition = '';
        switch (category) {
            case 'pokedex':
                condition = "pm.form_name = 'Normal' AND pm.is_available = true";
                break;
            case 'normal':
                condition = "pm.form_name = 'Normal' AND pm.is_available = true AND (pca.can_be_normal OR pca.can_be_normal IS NULL) AND NOT (COALESCE(pca.can_be_legendary, false) OR COALESCE(pca.can_be_mythical, false) OR COALESCE(pca.can_be_ultra_beast, false))";
                break;
            case 'legendary':
                condition = "pm.form_name = 'Normal' AND pm.is_available = true AND pca.can_be_legendary = true";
                break;
            case 'mythical':
                condition = "pm.form_name = 'Normal' AND pm.is_available = true AND pca.can_be_mythical = true";
                break;
            case 'ultra_beast':
                condition = "pm.form_name = 'Normal' AND pm.is_available = true AND pca.can_be_ultra_beast = true";
                break;
            case 'regional':
                condition = "pm.is_regional = true AND pm.is_available = true";
                break;
            case 'forms':
                condition = "pm.form_name != 'Normal' AND pm.form_name NOT LIKE 'Méga%' AND pm.form_name NOT LIKE 'Mega%' AND pm.form_name NOT LIKE 'Gigamax%' AND pm.form_name NOT LIKE 'Dynamax%' AND pm.is_available = true";
                break;
            case 'shiny':
                condition = "pm.form_name = 'Normal' AND pm.is_available = true AND COALESCE(pca.can_be_shiny, true) = true";
                break;
            case 'lucky':
                condition = "pm.form_name = 'Normal' AND pm.is_available = true AND COALESCE(pca.can_be_lucky, true) = true";
                break;
            case 'xxl':
                condition = "pm.form_name = 'Normal' AND pm.is_available = true AND COALESCE(pca.can_be_xxl, true) = true";
                break;
            case 'xxs':
                condition = "pm.form_name = 'Normal' AND pm.is_available = true AND COALESCE(pca.can_be_xxs, true) = true";
                break;
            case 'gmax':
                condition = "(pm.form_name = 'Gigamax' OR pm.form_name LIKE 'Gigamax%') AND pm.is_available = true";
                break;
            case 'dynamax':
                condition = "(pm.form_name = 'Dynamax' OR pm.form_name LIKE 'Dynamax%') AND pm.is_available = true";
                break;
            case 'mega':
                condition = "(pm.form_name LIKE 'Méga%' OR pm.form_name LIKE 'Mega%') AND pm.is_available = true";
                break;
            case 'obscure':
                condition = "pm.form_name = 'Normal' AND pm.is_available = true AND pca.can_be_obscure = true";
                break;
            case 'purified':
                condition = "pm.form_name = 'Normal' AND pm.is_available = true AND pca.can_be_purified = true";
                break;
            case 'perfect':
                condition = "pm.form_name = 'Normal' AND pm.is_available = true AND COALESCE(pca.can_be_perfect, true) = true";
                break;
            default:
                console.warn(`[API] Invalid tracking category: ${category}`);
                return res.status(400).json({ error: 'Invalid category' });
        }

        console.log(`[API] Fetching tracking list for user ${req.user.id}, category: ${category}, condition: ${condition}`);

        const query = `
            SELECT 
                pm.*,
                r.name_fr as region_name,
                p.has_normal, p.has_shiny, p.has_lucky, p.has_xxl, p.has_xxs,
                p.has_gmax, p.has_dynamax, p.has_mega, p.has_obscure, p.has_purifie as has_purified, p.has_parfait as has_perfect
            FROM pokemon_master pm
            LEFT JOIN pokemon_category_availability pca ON pm.pokemon_id = pca.pokemon_id AND pm.form_name = pca.form_name
            LEFT JOIN regions r ON pm.region_id = r.id
            LEFT JOIN pokedex p ON pm.pokemon_id = p.pokemon_id AND pm.form_name = p.form_name AND p.user_id = $1
            WHERE ${condition}
            ORDER BY pm.pokemon_id ASC, pm.form_name ASC
        `;

        console.log(`[API] Tracking Query for category: ${category}`);
        // console.log(`[API] Query: ${query}`);

        const result = await pool.query(query, [req.user.id]);
        console.log(`[API] Rows found: ${result.rows.length}`);

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Helper route for shiny collection
router.get('/shiny', authenticateToken, async (req, res) => {
    try {
        const pool = getPool(req);
        const result = await pool.query(`
            SELECT p.*, pm.name_fr, pm.name_en, pm.image_url, pm.region_id, r.name_fr as region_name
            FROM pokedex p
            INNER JOIN pokemon_master pm ON p.pokemon_id = pm.pokemon_id AND p.form_name = pm.form_name
            LEFT JOIN regions r ON pm.region_id = r.id
            WHERE p.user_id = $1 AND p.has_shiny = true
        `, [req.user.id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Helper route for lucky collection
router.get('/lucky', authenticateToken, async (req, res) => {
    try {
        const pool = getPool(req);
        const result = await pool.query(`
            SELECT p.*, pm.name_fr, pm.name_en, pm.image_url, pm.region_id, r.name_fr as region_name
            FROM pokedex p
            INNER JOIN pokemon_master pm ON p.pokemon_id = pm.pokemon_id AND p.form_name = pm.form_name
            LEFT JOIN regions r ON pm.region_id = r.id
            WHERE p.user_id = $1 AND p.has_lucky = true
        `, [req.user.id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Helper route for forms collection (variants)
router.get('/forms', authenticateToken, async (req, res) => {
    try {
        const pool = getPool(req);
        const result = await pool.query(`
            SELECT p.*, pm.name_fr, pm.name_en, pm.image_url, pm.region_id, r.name_fr as region_name
            FROM pokedex p
            INNER JOIN pokemon_master pm ON p.pokemon_id = pm.pokemon_id AND p.form_name = pm.form_name
            LEFT JOIN regions r ON pm.region_id = r.id
            WHERE p.user_id = $1 AND p.form_name != 'Normal'
        `, [req.user.id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});


// Get user's pokedex stats
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const pool = getPool(req);
        const result = await pool.query(
            `SELECT
                COUNT(*) FILTER(WHERE p.form_name = 'Normal') as total,
                COUNT(*) FILTER(WHERE p.has_normal AND p.form_name = 'Normal' AND NOT (COALESCE(pca.can_be_legendary, false) OR COALESCE(pca.can_be_mythical, false) OR COALESCE(pca.can_be_ultra_beast, false))) as normal,
                COUNT(*) FILTER(WHERE p.has_shiny AND p.form_name = 'Normal') as shiny,
                COUNT(*) FILTER(WHERE p.has_lucky AND p.form_name = 'Normal') as lucky,
                COUNT(*) FILTER(WHERE p.has_xxl AND p.form_name = 'Normal') as xxl,
                COUNT(*) FILTER(WHERE p.has_xxs AND p.form_name = 'Normal') as xxs,
                COUNT(*) FILTER(WHERE (p.form_name = 'Gigamax' OR p.form_name LIKE 'Gigamax%') AND p.has_normal) as gmax,
                COUNT(*) FILTER(WHERE (p.form_name = 'Dynamax' OR p.form_name LIKE 'Dynamax%') AND p.has_normal) as dynamax,
                COUNT(*) FILTER(WHERE (p.form_name LIKE 'Méga%' OR p.form_name LIKE 'Mega%') AND p.has_normal) as mega,
                COUNT(*) FILTER(WHERE p.has_obscure AND p.form_name = 'Normal') as obscure,
                COUNT(*) FILTER(WHERE p.has_purifie AND p.form_name = 'Normal') as purified,
                COUNT(*) FILTER(WHERE p.has_parfait AND p.form_name = 'Normal') as perfect,
                COUNT(*) FILTER(WHERE p.has_normal AND pca.can_be_legendary AND p.form_name = 'Normal') as legendary,
                COUNT(*) FILTER(WHERE p.has_normal AND pca.can_be_mythical AND p.form_name = 'Normal') as mythical,
                COUNT(*) FILTER(WHERE p.has_normal AND pca.can_be_ultra_beast AND p.form_name = 'Normal') as ultra_beast,
                COUNT(*) FILTER(WHERE pm.is_regional AND p.has_normal) as regional,
                COUNT(*) FILTER(WHERE p.has_normal AND p.form_name = 'Normal') as pokedex_count,
                (SELECT COUNT(*) FROM pokemon_category_availability pca2 JOIN pokemon_master pm2 ON pca2.pokemon_id = pm2.pokemon_id AND pca2.form_name = pm2.form_name WHERE pca2.form_name = 'Normal' AND pm2.is_available = true AND (pca2.can_be_normal OR pca2.can_be_normal IS NULL) AND NOT (COALESCE(pca2.can_be_legendary, false) OR COALESCE(pca2.can_be_mythical, false) OR COALESCE(pca2.can_be_ultra_beast, false))) as total_normal_available,
                (SELECT COUNT(*) FROM pokemon_category_availability pca2 JOIN pokemon_master pm2 ON pca2.pokemon_id = pm2.pokemon_id AND pca2.form_name = pm2.form_name WHERE pca2.can_be_shiny AND pca2.form_name = 'Normal' AND pm2.is_available = true) as total_shiny_available,
                (SELECT COUNT(*) FROM pokemon_category_availability pca2 JOIN pokemon_master pm2 ON pca2.pokemon_id = pm2.pokemon_id AND pca2.form_name = pm2.form_name WHERE pca2.can_be_lucky AND pca2.form_name = 'Normal' AND pm2.is_available = true) as total_lucky_available,
                (SELECT COUNT(*) FROM pokemon_category_availability pca2 JOIN pokemon_master pm2 ON pca2.pokemon_id = pm2.pokemon_id AND pca2.form_name = pm2.form_name WHERE pca2.can_be_xxl AND pca2.form_name = 'Normal' AND pm2.is_available = true) as total_xxl_available,
                (SELECT COUNT(*) FROM pokemon_category_availability pca2 JOIN pokemon_master pm2 ON pca2.pokemon_id = pm2.pokemon_id AND pca2.form_name = pm2.form_name WHERE pca2.can_be_xxs AND pca2.form_name = 'Normal' AND pm2.is_available = true) as total_xxs_available,
                (SELECT COUNT(*) FROM pokemon_master WHERE (form_name = 'Gigamax' OR form_name LIKE 'Gigamax%') AND is_available = true) as total_gmax_available,
                (SELECT COUNT(*) FROM pokemon_master WHERE (form_name = 'Dynamax' OR form_name LIKE 'Dynamax%') AND is_available = true) as total_dynamax_available,
                (SELECT COUNT(*) FROM pokemon_master WHERE (form_name LIKE 'Méga%' OR form_name LIKE 'Mega%') AND is_available = true) as total_mega_available,
                (SELECT COUNT(*) FROM pokemon_category_availability pca2 JOIN pokemon_master pm2 ON pca2.pokemon_id = pm2.pokemon_id AND pca2.form_name = pm2.form_name WHERE pca2.can_be_obscure AND pca2.form_name = 'Normal' AND pm2.is_available = true) as total_obscure_available,
                (SELECT COUNT(*) FROM pokemon_category_availability pca2 JOIN pokemon_master pm2 ON pca2.pokemon_id = pm2.pokemon_id AND pca2.form_name = pm2.form_name WHERE pca2.can_be_purified AND pca2.form_name = 'Normal' AND pm2.is_available = true) as total_purified_available,
                (SELECT COUNT(*) FROM pokemon_category_availability pca2 JOIN pokemon_master pm2 ON pca2.pokemon_id = pm2.pokemon_id AND pca2.form_name = pm2.form_name WHERE pca2.can_be_perfect AND pca2.form_name = 'Normal' AND pm2.is_available = true) as total_perfect_available,
                (SELECT COUNT(*) FROM pokemon_category_availability pca2 JOIN pokemon_master pm2 ON pca2.pokemon_id = pm2.pokemon_id AND pca2.form_name = pm2.form_name WHERE pca2.can_be_legendary AND pca2.form_name = 'Normal' AND pm2.is_available = true) as total_legendary_available,
                (SELECT COUNT(*) FROM pokemon_category_availability pca2 JOIN pokemon_master pm2 ON pca2.pokemon_id = pm2.pokemon_id AND pca2.form_name = pm2.form_name WHERE pca2.can_be_mythical AND pca2.form_name = 'Normal' AND pm2.is_available = true) as total_mythical_available,
                (SELECT COUNT(*) FROM pokemon_category_availability pca2 JOIN pokemon_master pm2 ON pca2.pokemon_id = pm2.pokemon_id AND pca2.form_name = pm2.form_name WHERE pca2.can_be_ultra_beast AND pca2.form_name = 'Normal' AND pm2.is_available = true) as total_ultra_beast_available,
                (SELECT COUNT(*) FROM pokemon_category_availability pca2 JOIN pokemon_master pm2 ON pca2.pokemon_id = pm2.pokemon_id AND pca2.form_name = pm2.form_name WHERE pca2.form_name = 'Normal' AND pm2.is_available = true) as total_pokedex_available,
                (SELECT COUNT(*) FROM pokemon_master WHERE is_regional AND is_available) as total_regional_available,
                COUNT(*) FILTER(WHERE p.has_normal AND p.form_name != 'Normal' AND p.form_name NOT LIKE 'Méga%' AND p.form_name NOT LIKE 'Mega%' AND p.form_name NOT LIKE 'Gigamax%' AND p.form_name NOT LIKE 'Dynamax%') as forms,
                (SELECT COUNT(*) FROM pokemon_master WHERE form_name != 'Normal' AND form_name NOT LIKE 'Méga%' AND form_name NOT LIKE 'Mega%' AND form_name NOT LIKE 'Gigamax%' AND form_name NOT LIKE 'Dynamax%' AND is_available) as total_forms_available
             FROM pokedex p
             LEFT JOIN pokemon_category_availability pca ON p.pokemon_id = pca.pokemon_id AND p.form_name = pca.form_name
             LEFT JOIN pokemon_master pm ON p.pokemon_id = pm.pokemon_id AND p.form_name = pm.form_name
             WHERE p.user_id = $1`,
            [req.user.id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get regional completion stats
router.get('/stats/regions', authenticateToken, async (req, res) => {
    try {
        const pool = getPool(req);
        const result = await pool.query(
            `SELECT 
                r.id as region_id,
                r.name_fr as region_name,
                r.name_key as region_key,
                COUNT(pm.pokemon_id) as total_pokemon,
                COUNT(p.id) FILTER (WHERE p.has_normal) as caught_normal,
                COUNT(p.id) FILTER (WHERE p.has_shiny) as caught_shiny,
                COUNT(p.id) FILTER (WHERE p.has_lucky) as caught_lucky,
                ROUND(COUNT(p.id) FILTER (WHERE p.has_normal)::numeric / NULLIF(COUNT(pm.pokemon_id), 0) * 100, 2) as completion_percentage
             FROM regions r
             JOIN pokemon_master pm ON r.id = pm.region_id
             LEFT JOIN pokedex p ON pm.pokemon_id = p.pokemon_id AND pm.form_name = p.form_name AND p.user_id = $1
             WHERE pm.form_name = 'Normal' AND pm.is_available = true
             GROUP BY r.id, r.name_fr, r.name_key
             ORDER BY r.id ASC`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});


// Get recently added Pokemon (for home dashboard) trade from other users (excluding current user)
router.get('/trade-available', authenticateToken, async (req, res) => {
    try {
        const pool = getPool(req);
        const result = await pool.query(
            `SELECT p.pokemon_id, p.form_name, pm.name_fr as name, pm.image_url, u.id as user_id, u.trainer_name as username, u.email,
    p.has_trade, p.trade_shiny, p.trade_xxl, p.trade_xxs,
    p.trade_gmax, p.trade_dynamax, p.trade_mega, p.trade_purified
             FROM pokedex p
             JOIN trainers u ON p.user_id = u.id
             INNER JOIN pokemon_master pm ON p.pokemon_id = pm.pokemon_id AND p.form_name = pm.form_name
WHERE(p.has_trade = true OR p.trade_shiny = true OR p.trade_xxl = true OR 
                    p.trade_xxs = true OR p.trade_gmax = true OR p.trade_dynamax = true OR p.trade_mega = true OR 
                    p.trade_purified = true) 
             AND p.user_id != $1
             ORDER BY p.pokemon_id`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});



// Add pokemon to pokedex
const addPokemonSchema = Joi.object({
    pokemon_id: Joi.number().integer().positive().required(),
    form_name: Joi.string().default('Normal')
});

router.post('/', authenticateToken, validateBody(addPokemonSchema), async (req, res) => {
    const { pokemon_id, form_name = 'Normal' } = req.body;


    if (!pokemon_id) {
        return res.status(400).json({ error: 'Pokemon ID is required' });
    }

    try {
        const pool = getPool(req);
        // Check if Pokemon exists in pokemon_master and is available
        const masterCheck = await pool.query(
            `SELECT pokemon_id, is_available 
             FROM pokemon_master 
             WHERE pokemon_id = $1 AND form_name = $2`,
            [pokemon_id, form_name]
        );

        if (masterCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Pokemon not found in master data' });
        }

        const masterData = masterCheck.rows[0];

        if (!masterData.is_available) {
            return res.status(403).json({ error: 'This Pokemon is not available in the Pokedex' });
        }

        // Insert user_id, pokemon_id and form_name
        const result = await pool.query(
            `INSERT INTO pokedex(user_id, pokemon_id, form_name, has_normal)
             VALUES($1, $2, $3, true)
             ON CONFLICT(user_id, pokemon_id, form_name) DO NOTHING
             RETURNING * `,
            [req.user.id, pokemon_id, form_name]
        );

        if (result.rows.length === 0) {
            return res.status(200).json({ message: 'Pokemon already in pokedex' });
        }

        // Return the full object with all joins
        const fullEntry = await pool.query(`
            SELECT 
                p.id, p.user_id, p.pokemon_id, p.form_name,
                p.has_normal, p.has_shiny, p.has_lucky, p.has_trade, p.has_xxl, p.has_xxs,
                p.has_gmax, p.has_dynamax, p.has_mega, p.has_obscure, p.has_purifie, p.has_parfait,
                p.trade_shiny, p.trade_xxl, p.trade_xxs, p.trade_gmax, p.trade_dynamax,
                p.trade_mega, p.trade_purified, p.created_at,
                pm.name_fr, pm.name_en, pm.is_regional, pm.regional_description,
                pm.classification_id, pm.region_id,
                COALESCE(pm.image_url, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/' || pm.pokemon_id || '.png') as image_url,
                c.name_fr as classification_name, c.name_key as classification_key,
                r.name_fr as region_name, r.name_key as region_key,
                t1.name_fr as type_primary_name, t1.color_hex as type_primary_color,
                t2.name_fr as type_secondary_name, t2.color_hex as type_secondary_color,
                COALESCE(pca.can_be_shiny, true) as can_be_shiny, 
                COALESCE(pca.can_be_lucky, true) as can_be_lucky, 
                COALESCE(pca.can_be_gmax, false) as can_be_gmax, 
                COALESCE(pca.can_be_mega, false) as can_be_mega, 
                COALESCE(pca.can_be_obscure, false) as can_be_obscure, 
                COALESCE(pca.can_be_purified, false) as can_be_purified, 
                COALESCE(pca.can_be_xxl, true) as can_be_xxl, 
                COALESCE(pca.can_be_xxs, true) as can_be_xxs,
                COALESCE(pca.can_be_legendary, false) as can_be_legendary, 
                COALESCE(pca.can_be_mythical, false) as can_be_mythical, 
                COALESCE(pca.can_be_ultra_beast, false) as can_be_ultra_beast, 
                COALESCE(pca.can_be_normal, true) as can_be_normal
            FROM pokedex p
            INNER JOIN pokemon_master pm ON p.pokemon_id = pm.pokemon_id AND p.form_name = pm.form_name
            LEFT JOIN classifications c ON pm.classification_id = c.id
            LEFT JOIN regions r ON pm.region_id = r.id
            LEFT JOIN types t1 ON pm.type_primary_id = t1.id
            LEFT JOIN types t2 ON pm.type_secondary_id = t2.id
            LEFT JOIN pokemon_category_availability pca ON p.pokemon_id = pca.pokemon_id AND p.form_name = pca.form_name
            WHERE p.user_id = $1 AND p.pokemon_id = $2 AND p.form_name = $3
        `, [req.user.id, pokemon_id, (form_name || 'Normal')]);

        res.status(201).json(fullEntry.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});


// Remove pokemon from pokedex
router.delete('/:pokemon_id', authenticateToken, async (req, res) => {
    const { pokemon_id } = req.params;
    const form_name = req.query.form || 'Normal';

    try {
        const pool = getPool(req);
        const result = await pool.query(
            'DELETE FROM pokedex WHERE user_id = $1 AND pokemon_id = $2 AND form_name = $3 RETURNING *',
            [req.user.id, pokemon_id, form_name]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Failed to toggle pokemon' });
        }

        res.json({ message: 'Pokemon removed from pokedex' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Search Pokemon by name in any language (Global Search)
router.get('/search/:query', authenticateToken, async (req, res) => {
    const query = req.params.query.toLowerCase();

    try {
        const pool = getPool(req);
        // Search in pokemon_master across all language fields and ID
        // This allows finding Pokemon not yet in the user's Pokedex
        const result = await pool.query(
            `SELECT 
                pm.pokemon_id, pm.form_name,
                pm.name_fr as name,
                pm.name_fr, pm.name_en, pm.name_de, pm.name_it,
                pm.image_url
             FROM pokemon_master pm
             WHERE pm.is_available = true
             AND (
                 LOWER(pm.name_fr) LIKE $1 OR 
                 LOWER(pm.name_en) LIKE $1 OR 
                 LOWER(pm.name_de) LIKE $1 OR 
                 LOWER(pm.name_it) LIKE $1 OR 
                 CAST(pm.pokemon_id AS TEXT) LIKE $1
             )
             ORDER BY pm.pokemon_id ASC, pm.form_name ASC
             LIMIT 10`,
            [`%${query}%`]
        );

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});


// Generic toggle endpoint for any boolean field
router.patch('/:pokemon_id/toggle/:field', authenticateToken, async (req, res) => {
    const { pokemon_id, field } = req.params;

    // Allowlist of valid fields to prevent SQL injection
    const validFields = [
        'has_normal', 'has_shiny', 'has_lucky', 'has_trade', 'has_xxl', 'has_xxs',
        'has_gmax', 'has_dynamax', 'has_mega', 'has_obscure', 'has_purifie', 'has_parfait',
        'has_legendary', 'has_mythical', 'has_ultra_beast',
        'trade_shiny', 'trade_xxl', 'trade_xxs', 'trade_gmax', 'trade_dynamax',
        'trade_mega', 'trade_purified', 'trade_legendary', 'trade_mythical', 'trade_ultra_beast'
    ];

    if (!validFields.includes(field)) {
        return res.status(400).json({ error: 'Invalid field for toggle' });
    }

    try {
        const pool = getPool(req);
        // REMOVED: Mutually exclusive categories logic. 
        // Now 'has_normal' is the single source of truth for standard form, regardless of classification.
        // We no longer deactivate 'has_legendary' when 'has_normal' is checked, because 'has_legendary' is deprecated/derived.

        // Define which fields are simple toggles
        // Note: We ignore requests to toggle deprecated fields if they come in, or distinct them if necessary.
        // For now, if frontend sends 'has_legendary', we should probably treat it as 'has_normal' if we want full compat,
        // but the plan is to update frontend to send 'has_normal'.

        if (field === 'has_legendary' || field === 'has_mythical' || field === 'has_ultra_beast') {
            // Redirect to has_normal for backward compatibility during migration
            // Or arguably, just toggle them as dummy fields if we want to phase them out completely.
            // But to satisfy "Standard form" unification:
            field = 'has_normal';
        }

        if (field === 'trade_legendary' || field === 'trade_mythical' || field === 'trade_ultra_beast') {
            field = 'has_trade';
        }

        const form_name = req.query.form || 'Normal';
        const query = `INSERT INTO pokedex (user_id, pokemon_id, form_name, ${field})
                 VALUES ($1, $2, $3, true)
                 ON CONFLICT (user_id, pokemon_id, form_name)
                 DO UPDATE SET ${field} = NOT pokedex.${field}
                 RETURNING *`;
        const params = [req.user.id, pokemon_id, form_name];
        // (Unified logic handles all fields)

        const result = await pool.query(query, params);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Failed to toggle pokemon' });
        }

        // Fetch the full entry with joins to avoid losing data in frontend
        const fullEntry = await pool.query(`
            SELECT 
                p.*, 
                pm.name_fr, pm.name_en, pm.image_url, pm.is_regional, pm.regional_description,
                pm.classification_id, pm.region_id,
                c.name_fr as classification_name, c.name_key as classification_key,
                r.name_fr as region_name, r.name_key as region_key,
                t1.name_fr as type_primary_name, t1.color_hex as type_primary_color,
                t2.name_fr as type_secondary_name, t2.color_hex as type_secondary_color,
                pca.can_be_shiny, pca.can_be_lucky, pca.can_be_gmax, pca.can_be_mega, 
                pca.can_be_obscure, pca.can_be_purified, pca.can_be_xxl, pca.can_be_xxs,
                pca.can_be_legendary, pca.can_be_mythical, pca.can_be_ultra_beast, pca.can_be_normal
            FROM pokedex p
            INNER JOIN pokemon_master pm ON p.pokemon_id = pm.pokemon_id AND p.form_name = pm.form_name
            LEFT JOIN classifications c ON pm.classification_id = c.id
            LEFT JOIN regions r ON pm.region_id = r.id
            LEFT JOIN types t1 ON pm.type_primary_id = t1.id
            LEFT JOIN types t2 ON pm.type_secondary_id = t2.id
            LEFT JOIN pokemon_category_availability pca ON p.pokemon_id = pca.pokemon_id AND p.form_name = pca.form_name
            WHERE p.user_id = $1 AND p.pokemon_id = $2 AND p.form_name = $3
        `, [req.user.id, pokemon_id, form_name]);

        res.json(fullEntry.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get Pokemon available for trade from other users (excluding current user)
router.get('/trade-available', authenticateToken, async (req, res) => {
    try {
        const pool = getPool(req);
        const result = await pool.query(
            `SELECT p.pokemon_id, pm.name_fr as name, pm.image_url, u.id as user_id, u.trainer_name as username, u.email,
    p.has_trade, p.trade_shiny, p.trade_xxl, p.trade_xxs,
    p.trade_gmax, p.trade_dynamax, p.trade_mega, p.trade_purified,
    p.trade_legendary, p.trade_mythical, p.trade_ultra_beast
             FROM pokedex p
             JOIN trainers u ON p.user_id = u.id
             INNER JOIN pokemon_master pm ON p.pokemon_id = pm.pokemon_id
WHERE(p.has_trade = true OR p.trade_shiny = true OR p.trade_xxl = true OR 
                    p.trade_xxs = true OR p.trade_gmax = true OR p.trade_dynamax = true OR p.trade_mega = true OR 
                    p.trade_purified = true OR p.trade_legendary = true OR p.trade_mythical = true OR p.trade_ultra_beast = true) 
             AND p.user_id != $1
             ORDER BY p.pokemon_id`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get recent Pokemon added by other users (last 10)
router.get('/recent-others', authenticateToken, async (req, res) => {
    try {
        const pool = getPool(req);
        const result = await pool.query(
            `SELECT p.id, p.pokemon_id, pm.name_fr as name, pm.image_url, p.created_at,
    u.trainer_name as username, u.email,
    p.has_shiny, p.has_lucky, p.has_xxl, p.has_xxs,
    p.has_trade, p.trade_shiny, p.trade_xxl, p.trade_xxs,
    p.trade_gmax, p.trade_dynamax, p.trade_mega, p.trade_purified
             FROM pokedex p
             JOIN trainers u ON p.user_id = u.id
             INNER JOIN pokemon_master pm ON p.pokemon_id = pm.pokemon_id
             WHERE p.user_id != $1
             ORDER BY p.created_at DESC
             LIMIT 10`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get user's most recent Pokemon activity
router.get('/my-recent', authenticateToken, async (req, res) => {
    try {
        const pool = getPool(req);
        const result = await pool.query(
            `SELECT p.pokemon_id, pm.name_fr as name, pm.image_url, p.created_at,
    p.has_shiny, p.has_lucky, p.has_xxl, p.has_xxs, p.has_gmax, p.has_dynamax,
    p.has_mega, p.has_obscure, p.has_purifie, p.has_parfait,
    p.has_trade, p.trade_shiny, p.trade_xxl, p.trade_xxs,
    p.trade_gmax, p.trade_dynamax, p.trade_mega, p.trade_purified
             FROM pokedex p
             INNER JOIN pokemon_master pm ON p.pokemon_id = pm.pokemon_id
             WHERE p.user_id = $1
             ORDER BY p.created_at DESC
             LIMIT 1`,
            [req.user.id]
        );
        res.json(result.rows[0] || null);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Toggle shiny flag for a pokemon
router.patch('/:pokemon_id/shiny', authenticateToken, async (req, res) => {
    const { pokemon_id } = req.params;

    try {
        const pool = getPool(req);
        const result = await pool.query(
            `UPDATE pokedex 
             SET has_shiny = NOT has_shiny 
             WHERE user_id = $1 AND pokemon_id = $2
RETURNING * `,
            [req.user.id, pokemon_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Failed to toggle pokemon' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Toggle lucky flag for a pokemon
router.patch('/:pokemon_id/lucky', authenticateToken, async (req, res) => {
    const { pokemon_id } = req.params;

    try {
        const pool = getPool(req);
        const result = await pool.query(
            `UPDATE pokedex 
             SET has_lucky = NOT has_lucky 
             WHERE user_id = $1 AND pokemon_id = $2
RETURNING * `,
            [req.user.id, pokemon_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Failed to toggle pokemon' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Toggle trade flag
router.patch('/:pokemon_id/trade', authenticateToken, async (req, res) => {
    const { pokemon_id } = req.params;
    try {
        const pool = getPool(req);
        const result = await pool.query(
            `UPDATE pokedex SET has_trade = NOT has_trade WHERE user_id = $1 AND pokemon_id = $2 RETURNING * `,
            [req.user.id, pokemon_id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Pokemon not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Toggle XXL flag
router.patch('/:pokemon_id/xxl', authenticateToken, async (req, res) => {
    const { pokemon_id } = req.params;
    try {
        const pool = getPool(req);
        const result = await pool.query(
            `UPDATE pokedex SET has_xxl = NOT has_xxl WHERE user_id = $1 AND pokemon_id = $2 RETURNING * `,
            [req.user.id, pokemon_id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Pokemon not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Toggle XXS flag
router.patch('/:pokemon_id/xxs', authenticateToken, async (req, res) => {
    const { pokemon_id } = req.params;
    try {
        const pool = getPool(req);
        const result = await pool.query(
            `UPDATE pokedex SET has_xxs = NOT has_xxs WHERE user_id = $1 AND pokemon_id = $2 RETURNING * `,
            [req.user.id, pokemon_id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Pokemon not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Toggle G-MAX flag
router.patch('/:pokemon_id/gmax', authenticateToken, async (req, res) => {
    const { pokemon_id } = req.params;
    try {
        const pool = getPool(req);
        const result = await pool.query(
            `UPDATE pokedex SET has_gmax = NOT has_gmax WHERE user_id = $1 AND pokemon_id = $2 RETURNING * `,
            [req.user.id, pokemon_id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Pokemon not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Toggle Méga flag
router.patch('/:pokemon_id/mega', authenticateToken, async (req, res) => {
    const { pokemon_id } = req.params;
    try {
        const pool = getPool(req);
        const result = await pool.query(
            `UPDATE pokedex SET has_mega = NOT has_mega WHERE user_id = $1 AND pokemon_id = $2 RETURNING * `,
            [req.user.id, pokemon_id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Pokemon not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Toggle Obscure flag
router.patch('/:pokemon_id/obscure', authenticateToken, async (req, res) => {
    const { pokemon_id } = req.params;
    try {
        const pool = getPool(req);
        const result = await pool.query(
            `UPDATE pokedex SET has_obscure = NOT has_obscure WHERE user_id = $1 AND pokemon_id = $2 RETURNING * `,
            [req.user.id, pokemon_id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Pokemon not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Toggle Purifié flag
router.patch('/:pokemon_id/purifie', authenticateToken, async (req, res) => {
    const { pokemon_id } = req.params;
    try {
        const pool = getPool(req);
        const result = await pool.query(
            `UPDATE pokedex SET has_purifie = NOT has_purifie WHERE user_id = $1 AND pokemon_id = $2 RETURNING * `,
            [req.user.id, pokemon_id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Pokemon not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Generic toggle endpoint for any boolean field

// IMPORTANT: Specific routes MUST come before parametrized routes (:pokemon_id)
// Get user's full pokedex (alias endpoint)
router.get('/my-pokedex', authenticateToken, async (req, res) => {
    try {
        const pool = getPool(req);
        const result = await pool.query(`
SELECT
p.*,
    pm.name_fr, pm.name_en, pm.name_de, pm.name_it,
    pm.classification_id, pm.region_id,
    pm.type_primary_id, pm.type_secondary_id,
    pm.trade_status as master_trade_status,
    pm.is_regional, pm.regional_description,
    c.name_fr as classification_name,
    r.name_fr as region_name,
    t1.name_fr as type_primary_name, t1.color_hex as type_primary_color,
    t2.name_fr as type_secondary_name, t2.color_hex as type_secondary_color,
    COALESCE(pca.can_be_normal, true) as can_be_normal,
    COALESCE(pca.can_be_legendary, false) as can_be_legendary,
    COALESCE(pca.can_be_mythical, false) as can_be_mythical,
    COALESCE(pca.can_be_ultra_beast, false) as can_be_ultra_beast
            FROM pokedex p
            INNER JOIN pokemon_master pm ON p.pokemon_id = pm.pokemon_id
            LEFT JOIN classifications c ON pm.classification_id = c.id
            LEFT JOIN regions r ON pm.region_id = r.id
            LEFT JOIN types t1 ON pm.type_primary_id = t1.id
            LEFT JOIN types t2 ON pm.type_secondary_id = t2.id
            LEFT JOIN pokemon_category_availability pca ON p.pokemon_id = pca.pokemon_id
            WHERE p.user_id = $1 AND pm.is_available = true
            ORDER BY p.pokemon_id ASC
        `, [req.user.id]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get specific pokemon from user's pokedex
router.get('/:pokemon_id', authenticateToken, async (req, res) => {
    const { pokemon_id } = req.params;
    const form_name = req.query.form || 'Normal';
    try {
        const pool = getPool(req);
        const result = await pool.query(
            `SELECT
    p.*,
    pm.name_fr, pm.name_en, pm.name_de, pm.name_it,
    pm.classification_id, pm.region_id,
    pm.type_primary_id, pm.type_secondary_id,
    pm.trade_status as master_trade_status,
    pm.is_regional, pm.regional_description,
    pm.image_url,
    c.name_fr as classification_name,
    c.name_key as classification_key,
    r.name_fr as region_name,
    r.name_key as region_key,
    t1.name_fr as type_primary_name,
    t1.name_key as type_primary_key,
    t1.color_hex as type_primary_color,
    t2.name_fr as type_secondary_name,
    t2.name_key as type_secondary_key,
    t2.color_hex as type_secondary_color,
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
             FROM pokedex p
             INNER JOIN pokemon_master pm ON p.pokemon_id = pm.pokemon_id AND p.form_name = pm.form_name
             LEFT JOIN classifications c ON pm.classification_id = c.id
             LEFT JOIN regions r ON pm.region_id = r.id
             LEFT JOIN types t1 ON pm.type_primary_id = t1.id
             LEFT JOIN types t2 ON pm.type_secondary_id = t2.id
             LEFT JOIN pokemon_category_availability pca ON p.pokemon_id = pca.pokemon_id AND p.form_name = pca.form_name
             WHERE p.user_id = $1 AND p.pokemon_id = $2 AND p.form_name = $3 AND pm.is_available = true`,
            [req.user.id, pokemon_id, form_name]
        );

        if (result.rows.length === 0) {
            // If not in pokedex, we still need availability info for the UI
            // Fetch just availability
            const availResult = await pool.query(
                `SELECT
    pm.*,
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
                  FROM pokemon_master pm
                  LEFT JOIN pokemon_category_availability pca ON pm.pokemon_id = pca.pokemon_id AND pm.form_name = pca.form_name
                  WHERE pm.pokemon_id = $1 AND pm.form_name = $2 AND pm.is_available = true`,
                [pokemon_id, form_name]
            );

            const availability = availResult.rows[0] || {
                can_be_normal: true,
                can_be_legendary: false,
                can_be_mythical: false,
                can_be_ultra_beast: false
            };

            return res.json({ ...availability, id: null }); // Return null id to signify not in pokedex, but with availability
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});
// Get all available forms for a species
router.get('/:pokemon_id/forms', authenticateToken, async (req, res) => {
    const { pokemon_id } = req.params;
    try {
        const pool = getPool(req);
        const result = await pool.query(
            `SELECT pm.*, 
                    t1.name_fr as type_primary_name, t1.color_hex as type_primary_color,
                    t2.name_fr as type_secondary_name, t2.color_hex as type_secondary_color,
                    r.name_fr as region_name, r.name_key as region_key,
                    c.name_fr as classification_name, c.name_key as classification_key,
                    COALESCE(pm.image_url, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/' || pm.pokemon_id || '.png') as image_url,
                    COALESCE(pca.can_be_normal, true) as can_be_normal,
                    COALESCE(pca.can_be_legendary, false) as can_be_legendary,
                    COALESCE(pca.can_be_mythical, false) as can_be_mythical,
                    COALESCE(pca.can_be_ultra_beast, false) as can_be_ultra_beast,
                    COALESCE(pca.can_be_shiny, true) as can_be_shiny,
                    COALESCE(pca.can_be_lucky, true) as can_be_lucky,
                    COALESCE(pca.can_be_xxl, true) as can_be_xxl,
                    COALESCE(pca.can_be_xxs, true) as can_be_xxs,
                    COALESCE(pca.can_be_gmax, false) as can_be_gmax,
                    COALESCE(pca.can_be_dynamax, false) as can_be_dynamax,
                    COALESCE(pca.can_be_mega, false) as can_be_mega,
                    COALESCE(pca.can_be_obscure, false) as can_be_obscure,
                    COALESCE(pca.can_be_purified, false) as can_be_purified,
                    COALESCE(pca.can_be_perfect, true) as can_be_perfect
             FROM pokemon_master pm
             LEFT JOIN types t1 ON pm.type_primary_id = t1.id
             LEFT JOIN types t2 ON pm.type_secondary_id = t2.id
             LEFT JOIN regions r ON pm.region_id = r.id
             LEFT JOIN classifications c ON pm.classification_id = c.id
             LEFT JOIN pokemon_category_availability pca ON pm.pokemon_id = pca.pokemon_id AND pm.form_name = pca.form_name
             WHERE pm.pokemon_id = $1 AND pm.is_available = true
             ORDER BY CASE WHEN pm.form_name = 'Normal' THEN 0 ELSE 1 END, pm.form_name`,
            [pokemon_id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});
// Bulk fill pokedex
router.post('/bulk-fill', authenticateToken, async (req, res) => {
    const { categories } = req.body;

    if (!Array.isArray(categories) || categories.length === 0) {
        return res.status(400).json({ error: 'Categories must be a non-empty array' });
    }

    // Map frontend category names to DB columns
    const categoryMap = {
        'normal': 'has_normal',
        'shiny': 'has_shiny',
        'lucky': 'has_lucky',
        'xxl': 'has_xxl',
        'xxs': 'has_xxs',
        'gmax': 'has_gmax',
        'dynamax': 'has_dynamax',
        'mega': 'has_mega',
        'obscure': 'has_obscure',
        'purified': 'has_purifie',
        'perfect': 'has_parfait'
    };

    // Validate categories
    const validCategories = categories.filter(c => categoryMap[c]);
    if (validCategories.length === 0) {
        return res.status(400).json({ error: 'No valid categories provided' });
    }

    const client = await pool.connect();
    try {
        const pool = getPool(req);
        await client.query('BEGIN');

        // Get user's preferred language
        const userRes = await client.query('SELECT preferred_language FROM trainers WHERE id = $1', [req.user.id]);
        const userLang = userRes.rows[0]?.preferred_language || 'fr';

        // 1. Get all available pokemon and their category availability
        const availabilityRes = await client.query(`
SELECT
gs.pokemon_id,
    COALESCE(pca.can_be_normal, true) as can_be_normal,
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
            FROM generate_series(1, 1025) AS gs(pokemon_id)
            JOIN pokemon_master pm ON gs.pokemon_id = pm.pokemon_id
            LEFT JOIN pokemon_category_availability pca ON gs.pokemon_id = pca.pokemon_id
            WHERE pm.is_available = true
    `);

        const availablePokemon = availabilityRes.rows;
        let updatedCount = 0;

        // 2. Prepare batch updates
        for (const poke of availablePokemon) {
            const updates = {};
            let shouldUpdate = false;

            // Check each selected category
            for (const cat of validCategories) {
                const dbCol = categoryMap[cat];
                const availabilityCol = 'can_be_' + (cat === 'perfect' ? 'perfect' : cat === 'purified' ? 'purified' : cat);

                if (poke[availabilityCol]) {
                    updates[dbCol] = true;
                    shouldUpdate = true;
                }
            }

            if (shouldUpdate) {
                const cols = Object.keys(updates);
                const updateCols = cols.map((col, i) => `${col} = true`).join(', ');

                // Insert only user_id, pokemon_id, and the selected categories
                // Names and images come from pokemon_master via JOIN
                await client.query(`
                    INSERT INTO pokedex(
        user_id, pokemon_id,
        ${cols.join(', ')}
    )
VALUES(
    $1, $2,
    ${cols.map(_ => 'true').join(', ')}
)
                    ON CONFLICT(user_id, pokemon_id) 
                    DO UPDATE SET ${updateCols}
`, [req.user.id, poke.pokemon_id]);

                updatedCount++;
            }
        }

        await client.query('COMMIT');
        res.json({ message: 'Bulk fill completed', count: updatedCount });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Server error during bulk fill' });
    } finally {
        client.release();
    }
});

module.exports = router;
