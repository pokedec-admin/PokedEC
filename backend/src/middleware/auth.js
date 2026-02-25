const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'
);

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

        const pool = req.app.locals.pool;
        if (!pool) {
            console.error('[Auth Middleware] Database pool not found in app.locals');
            return res.status(500).json({ error: 'Database configuration error' });
        }

        // Find the user by supabase_uid in local DB
        let userResult = await pool.query(
            'SELECT * FROM trainers WHERE supabase_uid = $1 OR email = $2 LIMIT 1',
            [data.user.id, data.user.email]
        );

        let backendUser;
        if (userResult.rows.length > 0) {
            backendUser = userResult.rows[0];

            if (!backendUser.supabase_uid) {
                console.log(`[Auth Middleware] Linking existing user ${backendUser.email} to Supabase UID ${data.user.id}`);
                await pool.query('UPDATE trainers SET supabase_uid = $1 WHERE id = $2', [data.user.id, backendUser.id]);
                backendUser.supabase_uid = data.user.id;
            }
        } else {
            console.log(`[Auth Middleware] Auto-provisioning new user: ${data.user.email}`);
            try {
                const email = data.user.email || `${data.user.id}@placeholder.supabase.com`;
                const trainer_name = data.user.user_metadata?.trainer_name || (data.user.email ? data.user.email.split('@')[0] : `Trainer_${data.user.id.substring(0, 8)}`);

                const insertResult = await pool.query(
                    'INSERT INTO trainers (email, trainer_name, team, supabase_uid, email_verified, is_admin) VALUES ($1, $2, $3, $4, true, $5) ON CONFLICT (email) DO UPDATE SET supabase_uid = $4 RETURNING *',
                    [
                        email,
                        trainer_name,
                        data.user.user_metadata?.team || '',
                        data.user.id,
                        data.user.user_metadata?.is_admin || false
                    ]
                );
                backendUser = insertResult.rows[0];
            } catch (insertErr) {
                console.error('[Auth Middleware] Auto-provisioning failed:', insertErr);
                return res.status(500).json({ error: 'Failed to create local user profile' });
            }
        }

        if (!backendUser || !backendUser.id) {
            return res.status(403).json({ error: 'User profile not found or could not be created' });
        }

        req.user = {
            id: parseInt(backendUser.id),
            email: backendUser.email,
            trainer_name: backendUser.trainer_name,
            supabase_uid: data.user.id,
            is_admin: backendUser.is_admin || false
        };
        next();
    } catch (err) {
        console.error('[Auth Middleware] Catch Error:', err);
        res.sendStatus(500);
    }
};


const syncUsers = async (pool) => {
    console.log("[Auth Service] Starting Supabase -> Local DB user sync...");
    try {
        const { data: { users }, error } = await supabase.auth.admin.listUsers();
        if (error) throw error;

        console.log(`[Auth Service] Found ${users.length} users in Supabase Auth`);

        for (const sbUser of users) {
            try {
                // Try to find local user
                const userRes = await pool.query(
                    "SELECT id FROM trainers WHERE supabase_uid = $1 OR email = $2",
                    [sbUser.id, sbUser.email]
                );

                if (userRes.rows.length === 0) {
                    console.log(`[Auth Service] Sync: Provisioning missing user ${sbUser.email}`);
                    await pool.query(
                        "INSERT INTO trainers (email, trainer_name, team, supabase_uid, email_verified, is_admin) VALUES ($1, $2, $3, $4, true, $5)",
                        [
                            sbUser.email,
                            sbUser.user_metadata?.trainer_name || sbUser.email?.split("@")[0] || "User",
                            sbUser.user_metadata?.team || "",
                            sbUser.id,
                            sbUser.user_metadata?.is_admin || false
                        ]
                    );
                } else {
                    const localUser = userRes.rows[0];
                    // Update supabase_uid if missing
                    await pool.query(
                        "UPDATE trainers SET supabase_uid = $1 WHERE id = $2 AND (supabase_uid IS NULL OR supabase_uid != $1)",
                        [sbUser.id, localUser.id]
                    );
                }
            } catch (err) {
                console.error(`[Auth Service] Failed to sync user ${sbUser.email}:`, err.message);
            }
        }
        console.log("[Auth Service] User sync completed");
    } catch (err) {
        console.error("[Auth Service] User sync failed:", err.message);
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

module.exports = { syncUsers, authenticateToken, authenticateAdmin, supabase };
