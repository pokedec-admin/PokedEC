const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');
const { authenticateAdmin } = require('../middleware/auth');

const supabase = createClient(
    process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'
);

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
router.get('/trainers', authenticateAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, email, trainer_name, team, phone, preferred_language, campfire_name, whatsapp_group, is_admin, is_active, created_at FROM trainers ORDER BY created_at DESC'
        );
        res.json({ users: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create new user (admin only) - Using Supabase Admin
router.post('/trainers', authenticateAdmin, async (req, res) => {
    const { email, password, trainer_name, team, is_admin, is_active } = req.body;

    try {
        // Create user in Supabase
        const { data, error } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { trainer_name, team, is_admin: !!is_admin }
        });

        if (error) return res.status(400).json({ error: error.message });

        // Sync to local DB
        const newUser = await pool.query(
            `INSERT INTO trainers (email, trainer_name, team, is_admin, is_active, email_verified, supabase_uid)
             VALUES ($1, $2, $3, $4, $5, $6, $7) 
             RETURNING id, email, trainer_name, team, is_admin, is_active, created_at`,
            [email, trainer_name, team || null, !!is_admin, is_active !== false, true, data.user.id]
        );

        res.status(201).json({ message: 'User created successfully', user: newUser.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update user (admin only) - Using Supabase Admin
router.put('/trainers/:id', authenticateAdmin, async (req, res) => {
    const { id } = req.params; // Local ID
    const { email, trainer_name, team, phone, email_verified, password, is_admin } = req.body;

    try {
        // Find user to get supabase_uid
        const userRes = await pool.query('SELECT supabase_uid FROM trainers WHERE id = $1', [id]);
        if (userRes.rows.length === 0) return res.status(404).json({ error: 'User not found' });

        const supabaseId = userRes.rows[0].supabase_uid;

        // Update Supabase if password or email or metadata changed
        if (supabaseId) {
            const updateData = {};
            if (password) updateData.password = password;
            if (email) updateData.email = email;
            if (trainer_name !== undefined || team !== undefined || is_admin !== undefined) {
                updateData.user_metadata = { trainer_name, team, is_admin };
            }

            if (Object.keys(updateData).length > 0) {
                const { error } = await supabase.auth.admin.updateUserById(supabaseId, updateData);
                if (error) return res.status(400).json({ error: error.message });
            }
        }

        // Update local DB
        const query = `UPDATE trainers
                 SET email = $1, trainer_name = $2, team = $3, phone = $4, email_verified = $5, is_admin = COALESCE($6, is_admin)
                 WHERE id = $7
                 RETURNING *`;
        const params = [email, trainer_name, team, phone, email_verified, is_admin, id];

        const result = await pool.query(query, params);

        res.json({ message: 'User updated successfully', user: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete user (admin only)
router.delete('/trainers/:id', authenticateAdmin, async (req, res) => {
    const { id } = req.params;

    try {
        const userRes = await pool.query('SELECT supabase_uid FROM trainers WHERE id = $1', [id]);
        if (userRes.rows.length > 0 && userRes.rows[0].supabase_uid) {
            await supabase.auth.admin.deleteUser(userRes.rows[0].supabase_uid);
        }

        const result = await pool.query('DELETE FROM trainers WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
