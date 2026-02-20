const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const { authenticateAdmin } = require('./auth');

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

// Get all users (admin only)
router.get('/users', authenticateAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, email, trainer_name, team, phone, preferred_language, campfire_name, whatsapp_group, is_admin, is_active, created_at FROM users ORDER BY created_at DESC'
        );
        res.json({ users: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create new user (admin only)
router.post('/users', authenticateAdmin, async (req, res) => {
    const { email, password, trainer_name, team, is_admin, is_active } = req.body;

    try {
        // Check if user exists
        const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        const newUser = await pool.query(
            `INSERT INTO users (email, password, trainer_name, team, is_admin, is_active, email_verified)
             VALUES ($1, $2, $3, $4, $5, $6, $7) 
             RETURNING id, email, trainer_name, team, is_admin, is_active, created_at`,
            [email, hashedPassword, trainer_name, team || null, is_admin || false, is_active !== false, true] // Default active and verified
        );

        res.status(201).json({ message: 'User created successfully', user: newUser.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update user (admin only)
router.put('/users/:id', authenticateAdmin, async (req, res) => {
    const { id } = req.params;
    const { email, trainer_name, team, phone, email_verified, password } = req.body;

    try {
        let query;
        let params;

        if (password) {
            // If password is provided, hash it and update
            const hashedPassword = await bcrypt.hash(password, 10);
            query = `UPDATE users 
                     SET email = $1, trainer_name = $2, team = $3, phone = $4, email_verified = $5, password = $6
                     WHERE id = $7
                     RETURNING id, email, trainer_name, team, phone, email_verified, is_admin`;
            params = [email, trainer_name, team, phone, email_verified, hashedPassword, id];
        } else {
            // Update without password
            query = `UPDATE users 
                     SET email = $1, trainer_name = $2, team = $3, phone = $4, email_verified = $5
                     WHERE id = $6
                     RETURNING id, email, trainer_name, team, phone, email_verified, is_admin`;
            params = [email, trainer_name, team, phone, email_verified, id];
        }

        const result = await pool.query(query, params);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'User updated successfully', user: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete user (admin only)
router.delete('/users/:id', authenticateAdmin, async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Toggle admin status (admin only)
router.put('/users/:id/admin', authenticateAdmin, async (req, res) => {
    const { id } = req.params;
    const { is_admin } = req.body;

    try {
        const result = await pool.query(
            'UPDATE users SET is_admin = $1 WHERE id = $2 RETURNING id, email, trainer_name, is_admin',
            [is_admin, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'Admin status updated successfully', user: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Toggle active status (admin only)
router.put('/users/:id/active', authenticateAdmin, async (req, res) => {
    const { id } = req.params;
    const { is_active } = req.body;

    try {
        const result = await pool.query(
            'UPDATE users SET is_active = $1 WHERE id = $2 RETURNING id, email, trainer_name, is_active',
            [is_active, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'User activation status updated', user: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
