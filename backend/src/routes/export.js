const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

const getPool = (req) => req.app.locals.pool;

/**
 * @swagger
 * /api/export/pokedex/csv:
 *   get:
 *     summary: Export user's pokedex to CSV
 *     tags: [Export]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: CSV file containing the pokedex data
 *       404:
 *         description: No data to export
 *       500:
 *         description: Server error
 */
router.get('/pokedex/csv', authenticateToken, async (req, res) => {
    const pool = getPool(req);
    try {
        const result = await pool.query(`
            SELECT 
                p.pokemon_id as "Pokemon ID",
                pm.name_fr as "Nom",
                p.form_name as "Forme",
                p.is_normal as "Normal",
                p.is_shiny as "Shiny",
                p.is_lucky as "Chanceux",
                p.is_xxl as "XXL",
                p.is_xxs as "XXS",
                p.is_perfect as "Parfait",
                p.is_purified as "Purifié",
                p.is_obscure as "Obscur",
                p.is_gmax as "G-Max",
                p.is_dynamax as "Dynamax",
                p.is_mega as "Méga"
            FROM pokedex p
            INNER JOIN pokemon_master pm ON p.pokemon_id = pm.pokemon_id AND p.form_name = pm.form_name
            WHERE p.user_id = $1
            ORDER BY p.pokemon_id ASC
        `, [req.user.id]);

        if (result.rows.length === 0) {
           return res.status(404).json({ message: 'No data to export' });
        }

        const fields = Object.keys(result.rows[0]);
        const csvRows = [];
        
        // Add Header
        csvRows.push(fields.join(';')); // Use semicolon for better Excel compatibility in FR regions

        // Add Data
        for (const row of result.rows) {
            const values = fields.map(field => {
                const val = row[field];
                if (typeof val === 'boolean') {
                    return val ? 'OUI' : 'NON';
                }
                const escaped = ('' + val).replace(/"/g, '""');
                return `"${escaped}"`;
            });
            csvRows.push(values.join(';'));
        }

        const csvString = '\uFEFF' + csvRows.join('\n'); // Add BOM for Excel UTF-8 support

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename=pokedec_export_${new Date().toISOString().split('T')[0]}.csv`);
        res.status(200).send(csvString);

    } catch (err) {
        console.error('[Export] Error:', err);
        res.status(500).json({ error: 'Failed to export data' });
    }
});

module.exports = router;
