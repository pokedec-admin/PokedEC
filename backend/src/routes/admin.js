const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { authenticateAdmin } = require('../middleware/auth');

const supabase = createClient(
    process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'
);

// Pool is obtained from app.locals (set up in index.js) to ensure correct DB per environment
const getPool = (req) => req.app.locals.pool;

// Get all users (admin only)
router.get('/trainers', authenticateAdmin, async (req, res) => {
    try {
        const pool = getPool(req);
        const result = await pool.query(
            'SELECT id, email, trainer_name, team, phone, preferred_language, campfire_name, whatsapp_group, trade_preference, is_admin, is_active, created_at FROM trainers ORDER BY created_at DESC'
        );
        res.json({ users: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create new user (admin only) - Using Supabase Admin
router.post('/trainers', authenticateAdmin, async (req, res) => {
    const { email, password, trainer_name, team, trade_preference, is_admin, is_active } = req.body;

    try {
        const pool = getPool(req);
        // Create user in Supabase
        const { data, error } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { trainer_name, team, trade_preference, is_admin: !!is_admin }
        });

        if (error) return res.status(400).json({ error: error.message });

        // Sync to local DB
        const newUser = await pool.query(
            `INSERT INTO trainers (email, trainer_name, team, trade_preference, is_admin, is_active, email_verified, supabase_uid)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
             RETURNING id, email, trainer_name, team, trade_preference, is_admin, is_active, created_at`,
            [email, trainer_name, team || null, trade_preference || null, !!is_admin, is_active !== false, true, data.user.id]
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
    const { email, trainer_name, team, phone, email_verified, password, is_admin, campfire_name, whatsapp_group, trade_preference } = req.body;

    try {
        const pool = getPool(req);
        // Find user to get supabase_uid
        const userRes = await pool.query('SELECT supabase_uid FROM trainers WHERE id = $1', [id]);
        if (userRes.rows.length === 0) return res.status(404).json({ error: 'User not found' });

        const supabaseId = userRes.rows[0].supabase_uid;

        // Update Supabase if password or email or metadata changed
        if (supabaseId) {
            const updateData = {};
            if (password) updateData.password = password;
            if (email) updateData.email = email;
            if (trainer_name !== undefined || team !== undefined || is_admin !== undefined || trade_preference !== undefined) {
                updateData.user_metadata = { trainer_name, team, trade_preference, is_admin };
            }

            if (Object.keys(updateData).length > 0) {
                const { error } = await supabase.auth.admin.updateUserById(supabaseId, updateData);
                if (error) return res.status(400).json({ error: error.message });
            }
        }

        // Update local DB
        const query = `UPDATE trainers
                 SET email = $1, trainer_name = $2, team = $3, phone = $4, email_verified = $5, is_admin = COALESCE($6, is_admin), campfire_name = COALESCE($8, campfire_name), whatsapp_group = COALESCE($9, whatsapp_group), trade_preference = COALESCE($10, trade_preference)
                 WHERE id = $7
                 RETURNING *`;
        const params = [email, trainer_name, team, phone, email_verified, is_admin, id, campfire_name, whatsapp_group, trade_preference];

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
        const pool = getPool(req);
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
