const express = require('express');
const router = express.Router();
// Pool is obtained from app.locals (set up in index.js) to ensure correct DB per environment
const getPool = (req) => req.app.locals.pool;
const { authenticateToken, authenticateAdmin } = require("../middleware/auth");
const { findMatchesForUser, findMutualMatches } = require('../services/trade-engine');


// Create trade request
router.post('/request', authenticateToken, async (req, res) => {
    const { target_user_id, pokemon_id } = req.body;

    if (!target_user_id || !pokemon_id) {
        return res.status(400).json({ error: 'Target user and Pokemon ID are required' });
    }

    try {
        const pool = getPool(req);
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

        // Trigger notification for the target user
        try {
            await pool.query(
                `INSERT INTO notifications (user_id, type, title, message, link)
                 VALUES ($1, 'trade_request', 'Nouvelle demande d’échange', $2, $3)`,
                [
                    target_user_id,
                    `${req.user.trainer_name} souhaite échanger un Pokémon avec vous !`,
                    '/trading'
                ]
            );
        } catch (notifierr) {
            console.error('[Notification Error] Failed to create trade notification:', notifierr);
            // Don't fail the request if notification fails
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
        const pool = getPool(req);
        const result = await pool.query(
            `SELECT tr.*, u.trainer_name as requester_name, u.email as requester_email
             FROM trade_requests tr
             JOIN trainers u ON tr.requester_id = u.id
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
        const pool = getPool(req);
        const result = await pool.query(
            `SELECT tr.*, u.trainer_name as target_name, u.email as target_email,
                    u.campfire_username, u.whatsapp_group
             FROM trade_requests tr
             JOIN trainers u ON tr.target_user_id = u.id
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
        const pool = getPool(req);
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

        // Trigger notification for the requester
        try {
            await pool.query(
                `INSERT INTO notifications (user_id, type, title, message, link)
                 VALUES ($1, 'trade_response', 'Réponse à votre demande d’échange', $2, $3)`,
                [
                    result.rows[0].requester_id,
                    `${req.user.trainer_name} a ${status === 'rejected' ? 'refusé' : 'accepté'} votre trajet.`,
                    '/trading'
                ]
            );
        } catch (notifierr) {
            console.error('[Notification Error] Failed to create trade response notification:', notifierr);
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
        const pool = getPool(req);
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

// Get predicted matches for current user (What others have that you want)
router.get('/matches', authenticateToken, async (req, res) => {
    try {
        const pool = getPool(req);
        const matches = await findMatchesForUser(pool, req.user.id);
        res.json(matches);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get mutual matches (Double cross-matches)
router.get('/matches/mutual', authenticateToken, async (req, res) => {
    try {
        const pool = getPool(req);
        const matches = await findMutualMatches(pool, req.user.id);
        res.json(matches);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get trade history (resolved requests)
router.get('/history', authenticateToken, async (req, res) => {
    try {
        const pool = getPool(req);
        const result = await pool.query(
            `SELECT tr.*, 
                    u_requester.trainer_name as requester_name,
                    u_target.trainer_name as target_name,
                    pm.name_fr as pokemon_name
             FROM trade_requests tr
             JOIN trainers u_requester ON tr.requester_id = u_requester.id
             JOIN trainers u_target ON tr.target_user_id = u_target.id
             JOIN pokemon_master pm ON tr.pokemon_id = pm.pokemon_id
             WHERE (tr.requester_id = $1 OR tr.target_user_id = $1) 
               AND tr.status != 'pending'
             ORDER BY tr.updated_at DESC
             LIMIT 50`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('[Trade History] error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
