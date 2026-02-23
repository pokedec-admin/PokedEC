const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { authenticateToken } = require('../middleware/auth');

// Database connection
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


// Create trade request
router.post('/request', authenticateToken, async (req, res) => {
    const { target_user_id, pokemon_id } = req.body;

    if (!target_user_id || !pokemon_id) {
        return res.status(400).json({ error: 'Target user and Pokemon ID are required' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO trade_requests (requester_id, target_user_id, pokemon_id, status)
             VALUES ($1, $2, $3, 'pending')
             ON CONFLICT (requester_id, target_user_id, pokemon_id) DO NOTHING
             RETURNING *`,
            [req.user.id, target_user_id, pokemon_id]
        );

        if (result.rows.length === 0) {
            return res.status(409).json({ error: 'Request already exists' });
        }

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get incoming requests (requests sent TO the current user)
router.get('/requests/incoming', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT tr.*, u.trainer_name as requester_name, u.email as requester_email
             FROM trade_requests tr
             JOIN users u ON tr.requester_id = u.id
             WHERE tr.target_user_id = $1 AND tr.status = 'pending'
             ORDER BY tr.created_at DESC`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get outgoing requests (requests sent BY the current user)
router.get('/requests/outgoing', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT tr.*, u.trainer_name as target_name, u.email as target_email,
                    u.campfire_username, u.whatsapp_group
             FROM trade_requests tr
             JOIN users u ON tr.target_user_id = u.id
             WHERE tr.requester_id = $1
             ORDER BY tr.created_at DESC`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Respond to request (as target user)
router.put('/request/:id/respond', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'rejected', 'contact_campfire', 'contact_whatsapp'

    if (!['rejected', 'contact_campfire', 'contact_whatsapp'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    try {
        const result = await pool.query(
            `UPDATE trade_requests 
             SET status = $1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $2 AND target_user_id = $3
             RETURNING *`,
            [status, id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Request not found or unauthorized' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Dismiss request (as requester, e.g. acknowledging rejection or contact info)
router.delete('/request/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            `DELETE FROM trade_requests 
             WHERE id = $1 AND requester_id = $2
             RETURNING *`,
            [id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Request not found or unauthorized' });
        }

        res.json({ message: 'Request dismissed' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
