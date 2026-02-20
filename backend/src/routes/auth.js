const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Database connection (should ideally be shared/injected)
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

const SECRET_KEY = process.env.JWT_SECRET;
if (!SECRET_KEY) {
    console.warn('WARNING: JWT_SECRET environment variable is not set!');
}

// Middleware to authenticate token
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

        // Map Supabase user to the format expected by the app
        req.user = {
            id: data.user.id,
            email: data.user.email,
            trainer_name: data.user.user_metadata?.trainer_name || 'User'
        };
        next();
    } catch (err) {
        console.error('[Auth Middleware] Catch Error:', err);
        res.sendStatus(500);
    }
};

// Middleware to authenticate admin
const authenticateAdmin = async (req, res, next) => {
    await authenticateToken(req, res, async () => {
        try {
            // We can check admin status in Supabase metadata first for speed
            const isAdmin = req.user.is_admin || false;

            // Or fallback to DB check (Supabase ID is now a string UUID)
            const result = await pool.query('SELECT is_admin FROM users WHERE id = $1 OR email = $2', [req.user.id, req.user.email]);
            if (result.rows.length > 0 && result.rows[0].is_admin) {
                return next();
            }

            if (!isAdmin) {
                return res.status(403).json({ error: 'Admin access required' });
            }
            next();
        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: 'Server error' });
        }
    });
};

// Identify Route (Resolve trainer_name to email)
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

// Signup Route
router.post('/signup', async (req, res) => {
    const { email, password, trainer_name, team, phone, campfire_name, whatsapp_group } = req.body;

    try {
        // Check if trainer_name exists (must be unique)
        const userCheck = await pool.query('SELECT * FROM users WHERE trainer_name = $1', [trainer_name]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ error: 'Trainer name already taken' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        const newUser = await pool.query(
            `INSERT INTO users (email, password, trainer_name, team, phone, campfire_name, whatsapp_group, email_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, email, trainer_name, team, phone, campfire_name, whatsapp_group, email_verified`,
            [email, hashedPassword, trainer_name, team || null, phone || null, campfire_name || null, whatsapp_group || null, false]
        );

        const user = newUser.rows[0];
        // Token now includes trainer_name
        const token = jwt.sign({ id: user.id, email: user.email, trainer_name: user.trainer_name }, SECRET_KEY, { expiresIn: '1h' });

        res.status(201).json({ message: 'User created successfully', token, user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Login Route
router.post('/login', async (req, res) => {
    const { trainer_name, password } = req.body;
    console.log(`[Login Attempt] Trainer: ${trainer_name}, Password provided: ${password ? 'YES' : 'NO'}`);

    try {
        const result = await pool.query('SELECT * FROM users WHERE trainer_name = $1', [trainer_name]);
        if (result.rows.length === 0) {
            console.log('[Login Failed] User not found');
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];
        console.log(`[Login Debug] User found: ID ${user.id}`);

        // If user has no password (e.g. Google Auth only), deny password login
        if (!user.password) {
            console.log('[Login Failed] No password set for user');
            return res.status(400).json({ error: 'Please log in with Google' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        console.log(`[Login Debug] Password valid: ${validPassword}`);

        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Check if account is active
        if (user.is_active === false) {
            return res.status(403).json({ error: 'Account is deactivated. Please contact admin.' });
        }

        const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '7d' });
        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                trainer_name: user.trainer_name,
                team: user.team,
                phone: user.phone,
                email_verified: user.email_verified,
                is_admin: user.is_admin || false,
                preferred_language: user.preferred_language
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Google Auth Route (Mock/Simplified for now)
// In a real app, you'd verify the token with Google's API
router.post('/google', async (req, res) => {
    const { token: googleToken, user: googleUser } = req.body;

    // Mock verification: Assume if we get a token and user info, it's valid for this demo
    // In production: verify googleToken using google-auth-library

    if (!googleUser || !googleUser.email) {
        return res.status(400).json({ error: 'Invalid Google User Data' });
    }

    try {
        // Check if user exists
        let result = await pool.query('SELECT * FROM users WHERE email = $1', [googleUser.email]);
        let user;

        if (result.rows.length === 0) {
            // Create new user from Google data
            // Note: Address is not collected here, might need a follow-up step or default nulls
            const newUser = await pool.query(
                `INSERT INTO users (email, google_id, trainer_name)
         VALUES ($1, $2, $3) RETURNING id, email, trainer_name`,
                [googleUser.email, googleUser.id, googleUser.name]
            );
            user = newUser.rows[0];
        } else {
            user = result.rows[0];
            // Update google_id if missing (linking accounts)
            if (!user.google_id) {
                await pool.query('UPDATE users SET google_id = $1 WHERE id = $2', [googleUser.id, user.id]);
            }
        }

        const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '1h' });
        res.json({
            message: 'Google Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                trainer_name: user.trainer_name,
                team: user.team,
                phone: user.phone,
                email_verified: user.email_verified,
                is_admin: user.is_admin || false,
                preferred_language: user.preferred_language
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get current user profile (authenticated)
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, email, trainer_name, team, phone, email_verified, is_admin, preferred_language, campfire_name, whatsapp_group FROM users WHERE id = $1',
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update Profile
router.put('/profile', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const updates = req.body; // { trainer_name, team, phone, preferred_language, campfire_name, whatsapp_group }

    try {
        const validFields = ['trainer_name', 'team', 'phone', 'preferred_language', 'campfire_name', 'whatsapp_group'];
        const setClause = [];
        const values = [];
        let paramCount = 1;

        for (const [key, value] of Object.entries(updates)) {
            if (validFields.includes(key)) {
                setClause.push(`${key} = $${paramCount}`);
                values.push(value);
                paramCount++;
            }
        }

        if (setClause.length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }

        values.push(userId);
        const query = `UPDATE users SET ${setClause.join(', ')} WHERE id = $${paramCount} RETURNING id, email, trainer_name, team, phone, preferred_language, campfire_name, whatsapp_group`;

        const result = await pool.query(query, values);

        res.json({ message: 'Profile updated successfully', user: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete Account Route
router.delete('/profile', authenticateToken, async (req, res) => {
    const userId = req.user.id;

    try {
        // Delete user (cascading deletes should handle related data if configured, 
        // otherwise we might need to delete from other tables first)
        // Assuming simple deletion for now or ON DELETE CASCADE in DB schema
        await pool.query('DELETE FROM users WHERE id = $1', [userId]);
        res.json({ message: 'Account deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});


// Forgot Password Route (Simulation)
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        // Check if user exists
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (result.rows.length > 0) {
            // Simulate sending email
            console.log(`[Auth] Sending password reset email to ${email}`);
            // In a real app, you would generate a token, save it to DB, and send email via SMTP
        } else {
            // Security: Don't reveal if user exists or not, but for logs we can know
            console.log(`[Auth] Password reset requested for non-existent email: ${email}`);
        }

        // Always return success to prevent email enumeration
        res.json({ message: 'If an account exists with this email, a password reset link has been sent.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Change password (authenticated users)
router.post('/change-password', authenticateToken, async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user.id;

    // Validate inputs
    if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({ error: 'All password fields are required' });
    }

    // Check if passwords match
    if (newPassword !== confirmPassword) {
        return res.status(400).json({ error: 'New password and confirmation do not match' });
    }

    // Validate password requirements
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
        return res.status(400).json({
            error: 'Password must be at least 8 characters long, contain at least one uppercase letter and one number'
        });
    }

    try {
        // Get current user's password hash
        const result = await pool.query('SELECT password FROM users WHERE id = $1', [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = result.rows[0];

        // Verify current password
        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        // Hash new password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update password in database
        await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, userId]);

        console.log(`[Password Change] Successful for user ID: ${userId}`);
        res.json({ message: 'Password changed successfully' });
    } catch (err) {
        console.error('[Password Change] Error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ============================================
// EMAIL VERIFICATION ROUTES
// ============================================

const emailService = require('../services/email.service');

// Request verification code (Step 1 of signup)
router.post('/request-verification', async (req, res) => {
    const { email, trainer_name, team, password, phone, campfire_name, whatsapp_group } = req.body;

    // Validate required fields
    if (!email || !trainer_name || !team || !password) {
        return res.status(400).json({ error: 'Email, trainer name, team, and password are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    try {
        // Check if user already exists
        const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Generate 4-digit code
        const code = emailService.generateVerificationCode();

        // Invalidate any previous codes for this email
        await pool.query('UPDATE email_verification_codes SET verified = true WHERE email = $1 AND verified = false', [email]);

        // Store new code in database
        await pool.query(
            'INSERT INTO email_verification_codes (email, code) VALUES ($1, $2)',
            [email, code]
        );

        // Send verification email
        await emailService.sendVerificationCode(email, code);

        console.log(`[Verification] Code sent to ${email}`);

        res.status(200).json({
            message: 'Verification code sent to your email',
            email: email
        });
    } catch (err) {
        console.error('[Verification] Error:', err);
        if (err.message === 'Failed to send verification email') {
            return res.status(500).json({ error: 'Failed to send verification email. Please check your email configuration.' });
        }
        res.status(500).json({ error: 'Server error during verification request' });
    }
});

// Verify code and create account (Step 2 of signup)
router.post('/verify-code', async (req, res) => {
    const { email, code, trainer_name, team, password, phone, campfire_name, whatsapp_group } = req.body;

    // Validate required fields
    if (!email || !code || !trainer_name || !team || !password) {
        return res.status(400).json({ error: 'All required fields must be provided' });
    }

    // Validate code format (4 digits)
    if (!/^\d{4}$/.test(code)) {
        return res.status(400).json({ error: 'Invalid code format' });
    }

    try {
        // Find the most recent unverified code for this email
        const codeResult = await pool.query(
            `SELECT * FROM email_verification_codes 
             WHERE email = $1 AND code = $2 AND verified = false 
             ORDER BY created_at DESC 
             LIMIT 1`,
            [email, code]
        );

        if (codeResult.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid or expired verification code' });
        }

        const verificationRecord = codeResult.rows[0];

        // Check if code has expired (5 minutes)
        const codeAge = (new Date() - new Date(verificationRecord.created_at)) / 1000 / 60; // minutes
        if (codeAge > 5) {
            return res.status(400).json({ error: 'Verification code has expired. Please request a new one.' });
        }

        // Check attempt limit (max 3 failed attempts)
        if (verificationRecord.attempts >= 3) {
            await pool.query('UPDATE email_verification_codes SET verified = true WHERE id = $1', [verificationRecord.id]);
            return res.status(400).json({ error: 'Too many failed attempts. Please request a new code.' });
        }

        // Increment attempt counter
        await pool.query(
            'UPDATE email_verification_codes SET attempts = attempts + 1 WHERE id = $1',
            [verificationRecord.id]
        );

        // Mark code as verified
        await pool.query('UPDATE email_verification_codes SET verified = true WHERE id = $1', [verificationRecord.id]);

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user account with email_verified = true
        const newUser = await pool.query(
            `INSERT INTO users (email, password, trainer_name, team, phone, campfire_name, whatsapp_group, email_verified)
             VALUES ($1, $2, $3, $4, $5, $6, $7, true) 
             RETURNING id, email, trainer_name, team, phone, campfire_name, whatsapp_group, email_verified, is_admin`,
            [email, hashedPassword, trainer_name, team || null, phone || null, campfire_name || null, whatsapp_group || null]
        );

        const user = newUser.rows[0];
        const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '7d' });

        console.log(`[Verification] Account created successfully for ${email}`);

        res.status(201).json({
            message: 'Account created successfully',
            token,
            user
        });
    } catch (err) {
        console.error('[Verification] Error during code verification:', err);
        res.status(500).json({ error: 'Server error during verification' });
    }
});

// Resend verification code
router.post('/resend-verification', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        // Check if user already exists
        const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Check rate limiting: max 3 resends per 15 minutes
        const recentCodes = await pool.query(
            `SELECT COUNT(*) FROM email_verification_codes 
             WHERE email = $1 AND created_at > NOW() - INTERVAL '15 minutes'`,
            [email]
        );

        if (parseInt(recentCodes.rows[0].count) >= 3) {
            return res.status(429).json({ error: 'Too many resend requests. Please wait 15 minutes.' });
        }

        // Generate new code
        const code = emailService.generateVerificationCode();

        // Invalidate previous codes
        await pool.query('UPDATE email_verification_codes SET verified = true WHERE email = $1 AND verified = false', [email]);

        // Store new code
        await pool.query(
            'INSERT INTO email_verification_codes (email, code) VALUES ($1, $2)',
            [email, code]
        );

        // Send email
        await emailService.sendVerificationCode(email, code);

        console.log(`[Verification] Code resent to ${email}`);

        res.status(200).json({ message: 'Verification code resent successfully' });
    } catch (err) {
        console.error('[Verification] Error during resend:', err);
        if (err.message === 'Failed to send verification email') {
            return res.status(500).json({ error: 'Failed to send verification email' });
        }
        res.status(500).json({ error: 'Server error during resend' });
    }
});

module.exports = { router, authenticateToken, authenticateAdmin };
