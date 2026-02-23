const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');

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

// Middleware to authenticate token using Supabase
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401);

    try {
        const { data, error } = await supabase.auth.getUser(token);

        if (error || !data.user) {
            console.error('[Auth Middleware] Supabase Error:', error);
            return res.sendStatus(403);
        }

        // Find the user by supabase_id in local DB
        const userResult = await pool.query(
            'SELECT * FROM users WHERE supabase_id = $1 OR email = $2 LIMIT 1',
            [data.user.id, data.user.email]
        );

        if (userResult.rows.length > 0) {
            const backendUser = userResult.rows[0];
            req.user = {
                id: backendUser.id,
                email: backendUser.email,
                trainer_name: backendUser.trainer_name,
                supabase_id: data.user.id,
                is_admin: backendUser.is_admin
            };

            // Link if needed
            if (!backendUser.supabase_id) {
                await pool.query('UPDATE users SET supabase_id = $1 WHERE id = $2', [data.user.id, backendUser.id]);
            }
        } else {
            // New user from Supabase
            req.user = {
                id: data.user.id,
                email: data.user.email,
                trainer_name: data.user.user_metadata?.trainer_name || 'User',
                supabase_id: data.user.id,
                is_admin: data.user.user_metadata?.is_admin || false
            };
        }
        next();
    } catch (err) {
        console.error('[Auth Middleware] Catch Error:', err);
        res.sendStatus(500);
    }
};

const authenticateAdmin = async (req, res, next) => {
    await authenticateToken(req, res, async () => {
        if (req.user && req.user.is_admin) {
            return next();
        }
        return res.status(403).json({ error: 'Admin access required' });
    });
};

// Identify Route
router.post('/identify', async (req, res) => {
    const { identifier } = req.body;
    try {
        const result = await pool.query('SELECT email FROM users WHERE trainer_name = $1 OR email = $1', [identifier]);
        if (result.rows.length > 0) {
            return res.json({ email: result.rows[0].email });
        }
        return res.status(404).json({ error: 'User not found' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Profile Routes
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM users WHERE supabase_id = $1 OR id::text = $1', [req.user.supabase_id]);
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
             WHERE supabase_id = $7 OR id::text = $7
             RETURNING *`,
            [trainer_name, team, phone, preferred_language, campfire_name, whatsapp_group, req.user.supabase_id]
        );

        // Also update Supabase metadata if trainer_name or team changed
        if (trainer_name || team) {
            await supabase.auth.admin.updateUserById(req.user.supabase_id, {
                user_metadata: { trainer_name, team }
            });
        }

        res.json({ message: 'Profile updated', user: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Signup/Login/Forgot Password (Supabase Proxy)
router.post('/signup', async (req, res) => {
    const { email, password, trainer_name, team } = req.body;
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { trainer_name, team } }
    });
    if (error) return res.status(400).json({ error: error.message });

    // Sync to local DB
    try {
        await pool.query(
            'INSERT INTO users (email, trainer_name, team, supabase_id, email_verified) VALUES ($1, $2, $3, $4, true) ON CONFLICT (email) DO UPDATE SET supabase_id = $4',
            [email, trainer_name, team, data.user.id]
        );
    } catch (e) {}

    res.status(201).json({ user: data.user, session: data.session });
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(400).json({ error: error.message });

    const userResult = await pool.query('SELECT * FROM users WHERE supabase_id = $1', [data.user.id]);
    res.json({ token: data.session.access_token, user: { ...data.user, ...userResult.rows[0] } });
});

router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:4200'}/auth/callback`
    });
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Reset link sent' });
});

module.exports = { router, authenticateToken, authenticateAdmin };
