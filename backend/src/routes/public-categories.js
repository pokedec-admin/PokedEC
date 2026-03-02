const express = require('express');
const router = express.Router();
// Pool is obtained from app.locals (set up in index.js) to ensure correct DB per environment
const getPool = (req) => req.app.locals.pool;
const { authenticateToken, authenticateAdmin } = require("../middleware/auth");

// Get global category availability
router.get('/availability', authenticateToken, async (req, res) => {
    try {
        const pool = getPool(req);
        // Fetch all availability settings
        // We only need the boolean flags for each pokemon
        const result = await pool.query(
            `SELECT 
                pokemon_id,
                COALESCE(can_be_normal, true) as can_be_normal,
                COALESCE(can_be_legendary, false) as can_be_legendary,
                COALESCE(can_be_mythical, false) as can_be_mythical,
                COALESCE(can_be_ultra_beast, false) as can_be_ultra_beast,
                COALESCE(can_be_shiny, false) as can_be_shiny,
                COALESCE(can_be_lucky, true) as can_be_lucky,
                COALESCE(can_be_xxl, true) as can_be_xxl,
                COALESCE(can_be_xxs, true) as can_be_xxs,
                COALESCE(can_be_gmax, false) as can_be_gmax,
                COALESCE(can_be_dynamax, false) as can_be_dynamax,
                COALESCE(can_be_mega, false) as can_be_mega,
                COALESCE(can_be_obscure, false) as can_be_obscure,
                COALESCE(can_be_purified, false) as can_be_purified,
                COALESCE(can_be_perfect, true) as can_be_perfect
             FROM pokemon_category_availability`
        );

        // Convert array to a map for faster lookup on frontend
        // Map<pokemon_id, availability_object>
        const availabilityMap = {};
        result.rows.forEach(row => {
            availabilityMap[row.pokemon_id] = row;
        });

        res.json(availabilityMap);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
