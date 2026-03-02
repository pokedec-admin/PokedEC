const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { authenticateToken, authenticateAdmin } = require('../middleware/auth');

// Pool is obtained from app.locals (set up in index.js) to ensure correct DB per environment
const getPool = (req) => req.app.locals.pool;

const supabase = createClient(
    process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'
);

// Identify Route
router.post('/identify', async (req, res) => {
    const { identifier } = req.body;
    if (!identifier) return res.status(400).json({ error: 'Identifier required' });

    try {
        const pool = getPool(req);
        const result = await pool.query('SELECT email FROM trainers WHERE LOWER(trainer_name) = LOWER($1) OR LOWER(email) = LOWER($1)', [identifier]);
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
        const pool = getPool(req);
        const result = await pool.query('SELECT * FROM trainers WHERE id = $1', [req.user.id]);
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
    const { trainer_name, team, phone, preferred_language, campfire_name, whatsapp_group, trade_preference } = req.body;
    try {
        const pool = getPool(req);
        const result = await pool.query(
            `UPDATE trainers
             SET trainer_name = COALESCE($1, trainer_name),
                 team = COALESCE($2, team),
                 phone = COALESCE($3, phone),
                 preferred_language = COALESCE($4, preferred_language),
                 campfire_name = COALESCE($5, campfire_name),
                 whatsapp_group = COALESCE($6, whatsapp_group),
                 trade_preference = COALESCE($7, trade_preference)
             WHERE id = $8
             RETURNING *`,
            [trainer_name, team, phone, preferred_language, campfire_name, whatsapp_group, trade_preference, req.user.id]
        );

        // Also update Supabase metadata if trainer_name, team, or trade_preference changed
        if (trainer_name || team || trade_preference) {
            try {
                const metadata = {};
                if (trainer_name) metadata.trainer_name = trainer_name;
                if (team) metadata.team = team;
                if (trade_preference) metadata.trade_preference = trade_preference;

                await supabase.auth.admin.updateUserById(req.user.supabase_uid, {
                    user_metadata: metadata
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
    const { email, password, trainer_name, team, trade_preference } = req.body;
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { trainer_name, team, trade_preference } }
    });
    if (error) return res.status(error.status || 400).json({ error: error.message });

    // Sync to local DB
    try {
        const pool = getPool(req);
        await pool.query(
            'INSERT INTO trainers (email, trainer_name, team, trade_preference, supabase_uid, email_verified) VALUES ($1, $2, $3, $4, $5, true) ON CONFLICT (email) DO UPDATE SET supabase_uid = $5, trade_preference = EXCLUDED.trade_preference',
            [email, trainer_name, team, trade_preference, data.user.id]
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

    let userResult = await getPool(req).query('SELECT * FROM trainers WHERE supabase_uid = $1 OR email = $2', [data.user.id, data.user.email]);
    let backendUser = userResult.rows[0];

    if (!backendUser) {
        // Auto-provision if missing during login too
        try {
            const pool = getPool(req);
            const insertResult = await pool.query(
                'INSERT INTO trainers (email, trainer_name, team, supabase_uid, email_verified) VALUES ($1, $2, $3, $4, true) RETURNING *',
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
