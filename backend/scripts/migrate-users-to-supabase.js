/**
 * Migration Script: Migrate existing PostgreSQL users to Supabase Auth
 * 
 * This script:
 * 1. Reads all users from PostgreSQL
 * 2. Creates each user in Supabase Auth (if not already exists)
 * 3. Links the backend user with Supabase UID
 * 4. Generates a migration report
 * 
 * Usage: node migrate-users-to-supabase.js
 */

const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

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

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function migrateUsersToSupabase() {
    console.log('🚀 Starting migration of users to Supabase Auth...\n');
    
    const report = {
        total: 0,
        migrated: 0,
        alreadyExists: 0,
        failed: 0,
        errors: []
    };

    try {
        // Get all users from PostgreSQL
        const usersResult = await pool.query(
            'SELECT id, email, trainer_name, password, is_admin, team FROM users ORDER BY id'
        );
        
        report.total = usersResult.rows.length;
        console.log(`📊 Found ${report.total} users in PostgreSQL\n`);

        // Migrate each user
        for (const user of usersResult.rows) {
            try {
                console.log(`Processing: ${user.trainer_name} (${user.email})`);

                // Check if user already exists in Supabase by email
                const { data: existingUsers, error: searchError } = await supabase.auth.admin.listUsers();
                
                let supabaseUser = existingUsers?.users?.find(u => u.email === user.email);

                if (supabaseUser) {
                    console.log(`  ✅ Already in Supabase Auth (UUID: ${supabaseUser.id})`);
                    report.alreadyExists++;
                    
                    // Link the user if not already linked
                    const linked = await pool.query(
                        'UPDATE users SET supabase_uid = $1 WHERE id = $2 AND supabase_uid IS NULL',
                        [supabaseUser.id, user.id]
                    );
                    if (linked.rowCount > 0) {
                        console.log(`  🔗 Linked to backend user ID ${user.id}`);
                    }
                } else {
                    // Create new user in Supabase Auth
                    console.log(`  Creating in Supabase Auth...`);
                    
                    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
                        email: user.email,
                        password: user.password || Math.random().toString(36).slice(-12), // Fallback password
                        email_confirm: true,
                        user_metadata: {
                            trainer_name: user.trainer_name,
                            team: user.team,
                            is_admin: user.is_admin || false
                        }
                    });

                    if (createError) {
                        throw createError;
                    }

                    console.log(`  ✅ Created in Supabase Auth (UUID: ${newUser.user.id})`);
                    report.migrated++;

                    // Link the user in PostgreSQL
                    await pool.query(
                        'UPDATE users SET supabase_uid = $1 WHERE id = $2',
                        [newUser.user.id, user.id]
                    );
                    console.log(`  🔗 Linked to backend user ID ${user.id}\n`);
                }
            } catch (err) {
                console.error(`  ❌ Error: ${err.message}\n`);
                report.failed++;
                report.errors.push({
                    user: user.email,
                    error: err.message
                });
            }
        }

        console.log('\n' + '='.repeat(60));
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

        console.log('\n✅ Migration completed!');
        console.log('\n📝 Next steps:');
        console.log('   1. Verify all users have supabase_uid in PostgreSQL');
        console.log('   2. Update middleware to use supabase_uid');
        console.log('   3. Once verified, remove sensitive data (email, password, phone)');

    } catch (err) {
        console.error('❌ Fatal error:', err.message);
        process.exit(1);
    } finally {
        pool.end();
    }
}

// Run migration
migrateUsersToSupabase();
