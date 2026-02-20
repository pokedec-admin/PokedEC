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

// Middleware to authenticate token (imported from auth.js in index.js, but we need it here if we want to use it directly or assume it's passed)
// For simplicity, we'll assume the main index.js passes the auth middleware or we re-implement/import it.
// Better approach: Export authenticateToken from auth.js and use it here.
const { authenticateToken, authenticateAdmin } = require('./auth');

// Create a suggestion
router.post('/', authenticateToken, async (req, res) => {
    const { type, content } = req.body;

    if (!type || !content) {
        return res.status(400).json({ error: 'Type and content are required' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO suggestions (user_id, type, content)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [req.user.id, type, content]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get current user's suggestions
router.get('/', authenticateToken, async (req, res) => {
    const includeArchived = req.query.archived === 'true';
    try {
        const result = await pool.query(
            `SELECT * FROM suggestions 
             WHERE user_id = $1 
             ${includeArchived ? '' : 'AND archived_user = false'}
             ORDER BY created_at DESC`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all suggestions (Admin only)
router.get('/admin', authenticateAdmin, async (req, res) => {
    const includeArchived = req.query.archived === 'true';
    try {
        const result = await pool.query(
            `SELECT s.*, u.trainer_name, u.email 
             FROM suggestions s
             JOIN users u ON s.user_id = u.id
             ${includeArchived ? '' : 'WHERE s.archived_admin = false'}
             ORDER BY s.created_at DESC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update suggestion status and response (Admin only)
router.patch('/admin/:id', authenticateAdmin, async (req, res) => {
    const { id } = req.params;
    const { status, admin_response } = req.body;

    try {
        const result = await pool.query(
            `UPDATE suggestions 
             SET status = COALESCE($1, status), 
                 admin_response = COALESCE($2, admin_response),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $3
             RETURNING *`,
            [status, admin_response, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Suggestion not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// User toggles read status of their own suggestion
router.patch('/:id/read', authenticateToken, async (req, res) => {
    const { id } = req.params;

    try {
        // Toggle the is_read status
        const result = await pool.query(
            `UPDATE suggestions 
             SET is_read = NOT is_read, updated_at = CURRENT_TIMESTAMP
             WHERE id = $1 AND user_id = $2
             RETURNING *`,
            [id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Suggestion not found or unauthorized' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// User toggles archive status of their own suggestion
router.patch('/:id/archive', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            `UPDATE suggestions 
             SET archived_user = NOT archived_user, updated_at = CURRENT_TIMESTAMP
             WHERE id = $1 AND user_id = $2
             RETURNING *`,
            [id, req.user.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Suggestion not found or unauthorized' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Admin toggles archive status of a suggestion
router.patch('/admin/:id/archive', authenticateAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            `UPDATE suggestions 
             SET archived_admin = NOT archived_admin, updated_at = CURRENT_TIMESTAMP
             WHERE id = $1
             RETURNING *`,
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Suggestion not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// User deletes their own suggestion
router.delete('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            `DELETE FROM suggestions 
             WHERE id = $1 AND user_id = $2
             RETURNING id`,
            [id, req.user.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Suggestion not found or unauthorized' });
        }
        res.json({ message: 'Suggestion deleted successfully', id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Admin deletes any suggestion
router.delete('/admin/:id', authenticateAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            'DELETE FROM suggestions WHERE id = $1 RETURNING id',
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Suggestion not found' });
        }
        res.json({ message: 'Suggestion deleted successfully', id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
