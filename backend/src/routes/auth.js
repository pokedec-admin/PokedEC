const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { createClient } = require('@supabase/supabase-js');
const { authenticateToken, authenticateAdmin } = require('../middleware/auth');
const { generate2FASecret, verify2FAToken } = require('../utils/twoFactor');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const { validateBody } = require('../middleware/validation');


// Rate limiters
const standardLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    message: { error: 'Too many requests from this IP, please try again after 15 minutes' },
    standardHeaders: true,
    legacyHeaders: false,
});

const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 auth attempts per hour
    message: { error: 'Too many authentication attempts from this IP, please try again after an hour' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Pool is obtained from app.locals (set up in index.js) to ensure correct DB per environment
const getPool = (req) => req.app.locals.pool;

const supabase = createClient(
    process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'
);

/**
 * @openapi
 * /api/auth/identify:
 *   post:
 *     summary: Identify a user by email or trainer name
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               identifier:
 *                 type: string
 *                 example: ash@pallet.com
 *     responses:
 *       200:
 *         description: User found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 email:
 *                   type: string
 *       404:
 *         description: User not found
 */
const identifySchema = Joi.object({
    identifier: Joi.string().required()
});

router.post('/identify', standardLimiter, validateBody(identifySchema), async (req, res) => {
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
/**
 * @openapi
 * /api/auth/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile returned
 *       401:
 *         description: Unauthorized
 */
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

const profileUpdateSchema = Joi.object({
    trainer_name: Joi.string().allow('', null),
    team: Joi.string().allow('', null),
    phone: Joi.string().allow('', null),
    preferred_language: Joi.string().length(2).allow('', null),
    campfire_name: Joi.string().allow('', null),
    whatsapp_group: Joi.boolean().allow(null),
    trade_preference: Joi.string().allow('', null)
});

router.put('/profile', authenticateToken, validateBody(profileUpdateSchema), async (req, res) => {
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
const signupSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    trainer_name: Joi.string().required(),
    team: Joi.string().allow(''),
    trade_preference: Joi.string().allow('')
});

router.post('/signup', authLimiter, validateBody(signupSchema), async (req, res) => {
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

const loginSchema = Joi.object({
    email: Joi.string().allow(''),
    trainer_name: Joi.string().allow(''),
    password: Joi.string().required()
}).or('email', 'trainer_name');

router.post('/login', authLimiter, validateBody(loginSchema), async (req, res) => {
    let { email, trainer_name, password } = req.body;

    let loginEmail = email || trainer_name;

    console.log(`[Login] Attempt for identifier: ${loginEmail}`);

    if (!loginEmail) {
        console.warn('[Login] Missing identifier');
        return res.status(400).json({ error: 'Email or trainer name is required' });
    }

    // If the user entered a trainer name (no @ symbol), look up their email
    if (!loginEmail.includes('@')) {
        try {
            console.log(`[Login] Looking up email for trainer_name: ${loginEmail}`);
            const userResult = await getPool(req).query('SELECT email FROM trainers WHERE trainer_name = $1', [loginEmail]);
            if (userResult.rows.length === 0) {
                console.warn(`[Login] Trainer name not found: ${loginEmail}`);
                return res.status(400).json({ error: 'Invalid login credentials' });
            }
            loginEmail = userResult.rows[0].email;
            console.log(`[Login] Resolved email: ${loginEmail}`);
        } catch (dbErr) {
            console.error('[Login] Database error during login email lookup:', dbErr);
            return res.status(500).json({ error: 'Internal server error during login' });
        }
    }

    try {
        console.log(`[Login] Calling Supabase signInWithPassword for: ${loginEmail}`);
        const { data, error } = await supabase.auth.signInWithPassword({ email: loginEmail, password });

        if (error) {
            console.error('[Login] Supabase Auth Error:', JSON.stringify(error, null, 2));
            return res.status(error.status || 400).json({ error: error.message });
        }

        console.log(`[Login] Supabase success for UID: ${data.user.id}`);

    let userResult = await getPool(req).query('SELECT * FROM trainers WHERE supabase_uid = $1 OR email = $2', [data.user.id, data.user.email]);
    let backendUser = userResult.rows[0];

    if (!backendUser) {
        console.log(`[Login] User not found in local DB, auto-provisioning: ${data.user.email}`);
        // Auto-provision if missing during login too
        try {
            const pool = getPool(req);
            const insertResult = await pool.query(
                'INSERT INTO trainers (email, trainer_name, team, supabase_uid, email_verified) VALUES ($1, $2, $3, $4, true) RETURNING *',
                [data.user.email, data.user.user_metadata?.trainer_name || data.user.email.split('@')[0], data.user.user_metadata?.team || '', data.user.id]
            );
            backendUser = insertResult.rows[0];
            console.log(`[Login] Auto-provisioned user: ${backendUser.id}`);
        } catch (e) {
            console.error('[Login Sync] Failed to auto-provision:', e);
        }
    }
    // Check if 2FA is enabled
    if (backendUser.two_factor_enabled && backendUser.two_factor_secret) {
        // Issue a temporary pre-auth token
        const preAuthToken = jwt.sign(
            { 
                action: '2fa_challenge', 
                userId: backendUser.id,
                supabase_session: data.session
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '5m' }
        );
        return res.json({ 
            require_2fa: true, 
            preAuthToken,
            user: { 
                id: backendUser.id, 
                trainer_name: backendUser.trainer_name,
                email: backendUser.email
            } 
        });
    }

    res.json({ 
        token: data.session.access_token, 
        refresh_token: data.session.refresh_token,
        user: { ...data.user, ...backendUser } 
    });
    } catch (authErr) {
        console.error('Supabase auth error:', authErr);
        return res.status(500).json({ error: 'Internal server error during authentication' });
    }
});

router.post('/refresh', async (req, res) => {
    const { refresh_token } = req.body;
    if (!refresh_token) return res.status(400).json({ error: 'Refresh token required' });

    const { data, error } = await supabase.auth.refreshSession({ refresh_token });
    if (error) return res.status(error.status || 401).json({ error: error.message });

    res.json({ 
        token: data.session.access_token, 
        refresh_token: data.session.refresh_token,
        user: data.user
    });
});

// 2FA Endpoints
router.get('/2fa/setup', authenticateToken, async (req, res) => {
    try {
        const pool = getPool(req);
        const { secret, qrCodeDataUrl } = await generate2FASecret(req.user.email);
        
        // Temporarily store the secret in the DB (but not enabled yet)
        await pool.query('UPDATE trainers SET two_factor_secret = $1 WHERE id = $2', [secret, req.user.id]);
        
        res.json({ qrCode: qrCodeDataUrl });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to setup 2FA' });
    }
});

router.post('/2fa/enable', authenticateToken, async (req, res) => {
    const { token } = req.body;
    try {
        const pool = getPool(req);
        const userRes = await pool.query('SELECT two_factor_secret FROM trainers WHERE id = $1', [req.user.id]);
        const secret = userRes.rows[0].two_factor_secret;

        if (!secret) return res.status(400).json({ error: '2FA not setup' });

        const isValid = verify2FAToken(token, secret);
        if (!isValid) return res.status(400).json({ error: 'Invalid token' });

        await pool.query('UPDATE trainers SET two_factor_enabled = true WHERE id = $1', [req.user.id]);
        res.json({ message: '2FA enabled successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to enable 2FA' });
    }
});

router.post('/2fa/disable', authenticateToken, async (req, res) => {
    const { token } = req.body;
    try {
        const pool = getPool(req);
        const userRes = await pool.query('SELECT two_factor_secret, two_factor_enabled FROM trainers WHERE id = $1', [req.user.id]);
        const { two_factor_secret, two_factor_enabled } = userRes.rows[0];

        if (!two_factor_enabled) return res.status(400).json({ error: '2FA is not enabled' });

        const isValid = verify2FAToken(token, two_factor_secret);
        if (!isValid) return res.status(400).json({ error: 'Invalid token' });

        await pool.query('UPDATE trainers SET two_factor_enabled = false, two_factor_secret = NULL WHERE id = $1', [req.user.id]);
        res.json({ message: '2FA disabled successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to disable 2FA' });
    }
});

router.post('/2fa/verify', authLimiter, async (req, res) => {
    const { preAuthToken, token } = req.body;
    try {
        const decoded = jwt.verify(preAuthToken, process.env.JWT_SECRET || 'your-secret-key');
        if (decoded.action !== '2fa_challenge') {
            return res.status(401).json({ error: 'Invalid pre-auth token' });
        }

        const pool = getPool(req);
        const userRes = await pool.query('SELECT * FROM trainers WHERE id = $1', [decoded.userId]);
        const backendUser = userRes.rows[0];

        if (!backendUser || !backendUser.two_factor_enabled || !backendUser.two_factor_secret) {
            return res.status(401).json({ error: '2FA not active for this user' });
        }

        const isValid = verify2FAToken(token, backendUser.two_factor_secret);
        if (!isValid) return res.status(401).json({ error: 'Invalid 2FA token' });

        const session = decoded.supabase_session;
        res.json({ 
            token: session.access_token, 
            refresh_token: session.refresh_token,
            user: { ...backendUser } 
        });
    } catch (err) {
        console.error(err);
        res.status(401).json({ error: 'Invalid or expired pre-auth token' });
    }
});

router.post('/forgot-password', authLimiter, async (req, res) => {
    const { email } = req.body;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:4200'}/auth/callback`
    });
    if (error) return res.status(error.status || 400).json({ error: error.message });
    res.json({ message: 'Reset link sent' });
});

module.exports = { router, authenticateToken, authenticateAdmin };
