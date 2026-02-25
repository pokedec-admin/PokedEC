/**
 * Simplified Migration Script: Migrate existing PostgreSQL users to Supabase Auth
 * Uses only PostgreSQL and Supabase REST API directly, avoiding complex dependencies
 */

const { Pool } = require('pg');
const https = require('https');

// Configuration from environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('❌ Missing required environment variables:');
    console.error('   - SUPABASE_URL');
    console.error('   - SUPABASE_SERVICE_ROLE_KEY');
    console.error('\nUsage:');
    console.error('   export SUPABASE_URL=https://your-project.supabase.co');
    console.error('   export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
    console.error('   node migrate-users-to-supabase-simple.js');
    process.exit(1);
}

const poolConfig = {
    host: process.env.SUPABASE_DB_HOST,
    user: process.env.SUPABASE_DB_USER,
    password: process.env.SUPABASE_DB_PASSWORD,
    database: process.env.SUPABASE_DB_NAME,
    port: parseInt(process.env.SUPABASE_DB_PORT),
    ssl: { rejectUnauthorized: false }
};

if (!poolConfig.host || !poolConfig.user || !poolConfig.password) {
    console.error('❌ Missing required database environment variables:');
    console.error('   - SUPABASE_DB_HOST');
    console.error('   - SUPABASE_DB_USER');
    console.error('   - SUPABASE_DB_PASSWORD');
    console.error('   - SUPABASE_DB_NAME');
    console.error('   - SUPABASE_DB_PORT');
    process.exit(1);
}

const pool = new Pool(poolConfig);

// Helper function to call Supabase Auth API
function supabaseAuthApi(method, path, body = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(SUPABASE_URL + path);
        const options = {
            method,
            hostname: url.hostname,
            path: url.pathname + url.search,
            headers: {
                'Content-Type': 'application/json',
                'apikey': SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(data) });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function migrateUsersToSupabase() {
    console.log('🚀 Starting migration of users to Supabase Auth (Simplified)...\n');

    const report = {
        total: 0,
        migrated: 0,
        alreadyExists: 0,
        failed: 0,
        errors: []
    };

    try {
        // Get all users from PostgreSQL
        console.log('📊 Fetching users from PostgreSQL...');
        const usersResult = await pool.query(
            'SELECT id, email, trainer_name, password, is_admin, team FROM trainers ORDER BY id'
        );

        report.total = usersResult.rows.length;
        console.log(`Found ${report.total} users\n`);

        // Get existing Supabase users
        console.log('🔍 Fetching existing Supabase Auth users...');
        const usersResp = await supabaseAuthApi('GET', '/auth/v1/admin/users');
        const supabaseUsers = usersResp.data?.users || [];
        const supabaseEmails = new Set(supabaseUsers.map(u => u.email));
        console.log(`Found ${supabaseUsers.length} users in Supabase Auth\n`);

        // Migrate each user
        console.log('📋 Processing users:\n');
        for (const user of usersResult.rows) {
            try {
                console.log(`${user.id}. ${user.trainer_name} (${user.email})`);

                if (supabaseEmails.has(user.email)) {
                    // Find the UUID for this email
                    const supabaseUser = supabaseUsers.find(u => u.email === user.email);
                    console.log(`   ✅ Already in Supabase Auth`);
                    report.alreadyExists++;

                    // Link if not already linked
                    const linked = await pool.query(
                        'UPDATE trainers SET supabase_uid = $1 WHERE id = $2 AND supabase_uid IS NULL',
                        [supabaseUser.id, user.id]
                    );
                    if (linked.rowCount > 0) {
                        console.log(`   🔗 Linked to backend (ID: ${user.id})`);
                    }
                } else {
                    // Create new user in Supabase Auth
                    console.log(`   Creating in Supabase Auth...`);

                    const createResp = await supabaseAuthApi('POST', '/auth/v1/admin/users', {
                        email: user.email,
                        password: user.password || Math.random().toString(36).slice(-12),
                        email_confirm: true,
                        user_metadata: {
                            trainer_name: user.trainer_name,
                            team: user.team,
                            is_admin: user.is_admin || false
                        }
                    });

                    if (createResp.status === 201 && createResp.data?.user?.id) {
                        const supabaseUid = createResp.data.user.id;
                        console.log(`   ✅ Created in Supabase Auth`);
                        report.migrated++;

                        // Link in PostgreSQL
                        await pool.query(
                            'UPDATE trainers SET supabase_uid = $1 WHERE id = $2',
                            [supabaseUid, user.id]
                        );
                        console.log(`   🔗 Linked (UUID: ${supabaseUid.substring(0, 8)}...)`);
                    } else {
                        throw new Error(createResp.data?.message || `HTTP ${createResp.status}`);
                    }
                }
                console.log('');
            } catch (err) {
                console.error(`   ❌ Error: ${err.message}\n`);
                report.failed++;
                report.errors.push({
                    user: user.email,
                    error: err.message
                });
            }
        }

        // Print report
        console.log('='.repeat(60));
        console.log('📋 MIGRATION REPORT');
        console.log('='.repeat(60));
        console.log(`Total users:        ${report.total}`);
        console.log(`Newly migrated:     ${report.migrated}`);
        console.log(`Already in Auth:    ${report.alreadyExists}`);
        console.log(`Failed:             ${report.failed}`);
        console.log('='.repeat(60));

        if (report.errors.length > 0) {
            console.log('\n⚠️  ERRORS:');
            report.errors.forEach(err => {
                console.log(`  - ${err.user}: ${err.error}`);
            });
        }

        const linked = report.migrated + report.alreadyExists;
        const percentage = Math.round((linked / report.total) * 100);

        console.log('\n📈 SUMMARY:');
        console.log(`✅ Successfully linked: ${linked}/${report.total} (${percentage}%)`);

        if (linked === report.total) {
            console.log('\n🎉 All users successfully migrated to Supabase Auth!');
            console.log('You can now safely remove sensitive data.');
        } else {
            console.log('\n⏳ Migration partially complete. Fix errors and retry.');
        }

    } catch (err) {
        console.error('❌ Fatal error:', err.message);
        process.exit(1);
    } finally {
        pool.end();
    }
}

migrateUsersToSupabase();
