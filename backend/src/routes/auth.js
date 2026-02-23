const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { authenticateToken, authenticateAdmin, supabase } = require('../middleware/auth');

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

// Identify Route
router.post('/identify', async (req, res) => {
    const { identifier } = req.body;
    if (!identifier) return res.status(400).json({ error: 'Identifier required' });

    try {
        const result = await pool.query('SELECT email FROM users WHERE LOWER(trainer_name) = LOWER($1) OR LOWER(email) = LOWER($1)', [identifier]);
        if (result.rows.length > 0) {
            return res.json({ email: result.rows[0].email });
        }
        return res.status(404).json({ error: 'User not found locally. Please try with your email.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Profile Routes
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User profile not found' });
        }
        res.json({ user: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.put('/profile', authenticateToken, async (req, res) => {
    const { trainer_name, team, phone, preferred_language, campfire_name, whatsapp_group } = req.body;
    try {
        const result = await pool.query(
            `UPDATE users
             SET trainer_name = COALESCE($1, trainer_name),
                 team = COALESCE($2, team),
                 phone = COALESCE($3, phone),
                 preferred_language = COALESCE($4, preferred_language),
                 campfire_name = COALESCE($5, campfire_name),
                 whatsapp_group = COALESCE($6, whatsapp_group)
             WHERE id = $7
             RETURNING *`,
            [trainer_name, team, phone, preferred_language, campfire_name, whatsapp_group, req.user.id]
        );

        // Also update Supabase metadata if trainer_name or team changed
        if (trainer_name || team) {
            try {
                await supabase.auth.admin.updateUserById(req.user.supabase_uid, {
                    user_metadata: { trainer_name, team }
                });
            } catch (supaErr) {
                console.error('[Profile Update] Supabase metadata sync failed:', supaErr);
            }
        }

        res.json({ message: 'Profile updated', user: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Signup/Login/Forgot Password (Supabase Proxy) - Kept for compatibility but might be bypassed by frontend
router.post('/signup', async (req, res) => {
    const { email, password, trainer_name, team } = req.body;
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { trainer_name, team } }
    });
    if (error) return res.status(error.status || 400).json({ error: error.message });

    // Sync to local DB
    try {
        await pool.query(
            'INSERT INTO users (email, trainer_name, team, supabase_uid, email_verified) VALUES ($1, $2, $3, $4, true) ON CONFLICT (email) DO UPDATE SET supabase_uid = $4',
            [email, trainer_name, team, data.user.id]
        );
    } catch (e) {
        console.error('[Signup Sync] Failed to sync to local DB:', e);
    }

    res.status(201).json({ user: data.user, session: data.session });
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(error.status || 400).json({ error: error.message });

    let userResult = await pool.query('SELECT * FROM users WHERE supabase_uid = $1 OR email = $2', [data.user.id, data.user.email]);
    let backendUser = userResult.rows[0];

    if (!backendUser) {
        // Auto-provision if missing during login too
        try {
             const insertResult = await pool.query(
                'INSERT INTO users (email, trainer_name, team, supabase_uid, email_verified) VALUES ($1, $2, $3, $4, true) RETURNING *',
                [data.user.email, data.user.user_metadata?.trainer_name || data.user.email.split('@')[0], data.user.user_metadata?.team || '', data.user.id]
            );
            backendUser = insertResult.rows[0];
        } catch (e) {
            console.error('[Login Sync] Failed to auto-provision:', e);
        }
    }

    res.json({ token: data.session.access_token, user: { ...data.user, ...backendUser } });
});

router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:4200'}/auth/callback`
    });
    if (error) return res.status(error.status || 400).json({ error: error.message });
    res.json({ message: 'Reset link sent' });
});

module.exports = { router, authenticateToken, authenticateAdmin };
