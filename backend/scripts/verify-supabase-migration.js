/**
 * Verification Script: Check migration status
 * 
 * Shows which users are linked to Supabase Auth and which are not
 * Usage: node verify-supabase-migration.js
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

async function verifyMigration() {
    console.log('🔍 Verifying Supabase Auth migration...\n');

    try {
        // Get all users from PostgreSQL
        const postgresResult = await pool.query(
            `SELECT 
                id, 
                email, 
                trainer_name, 
                supabase_uid,
                CASE WHEN supabase_uid IS NOT NULL THEN 'Linked' ELSE 'Not Linked' END as status
             FROM users 
             ORDER BY id`
        );

        // Get all users from Supabase
        const { data: supabaseUsers, error } = await supabase.auth.admin.listUsers();
        
        if (error) {
            console.error('❌ Error fetching Supabase users:', error.message);
            return;
        }

        const supabaseEmailSet = new Set(supabaseUsers.users.map(u => u.email));

        console.log('📊 MIGRATION STATUS\n');
        console.log('Backend Users:'.padEnd(30) + postgresResult.rows.length);
        console.log('Supabase Auth Users:'.padEnd(30) + supabaseUsers.users.length);
        console.log('\n' + '='.repeat(80));

        let linked = 0;
        let notLinked = 0;
        let inSupabaseButNotLinked = 0;

        console.log('\n📋 DETAILED STATUS:\n');
        console.log('ID'.padEnd(5) + 'Trainer Name'.padEnd(25) + 'Email'.padEnd(30) + 'Status');
        console.log('-'.repeat(80));

        for (const user of postgresResult.rows) {
            const status = user.supabase_uid ? '✅ Linked' : '❌ Not Linked';
            console.log(
                user.id.toString().padEnd(5) +
                user.trainer_name.padEnd(25) +
                (user.email || 'N/A').padEnd(30) +
                status
            );

            if (user.supabase_uid) {
                linked++;
            } else {
                notLinked++;
            }
        }

        // Check if any emails are in Supabase but not linked in backend
        console.log('\n' + '='.repeat(80));
        console.log('\n🔗 LINKING CHECK:\n');

        const notLinkedUsers = postgresResult.rows.filter(u => !u.supabase_uid);
        const notLinkedEmails = new Set(notLinkedUsers.map(u => u.email));

        inSupabaseButNotLinked = Array.from(notLinkedEmails).filter(email => supabaseEmailSet.has(email)).length;

        if (inSupabaseButNotLinked > 0) {
            console.log(`⚠️  ${inSupabaseButNotLinked} user(s) exist in Supabase but are NOT linked in backend:`);
            notLinkedUsers.forEach(user => {
                if (supabaseEmailSet.has(user.email)) {
                    console.log(`  - ${user.trainer_name} (${user.email})`);
                }
            });
        }

        console.log('\n' + '='.repeat(80));
        console.log('\n📈 SUMMARY:\n');
        console.log(`✅ Linked to Supabase:    ${linked}/${postgresResult.rows.length}`);
        console.log(`❌ Not yet linked:       ${notLinked}/${postgresResult.rows.length}`);
        console.log(`📊 Progress:             ${Math.round((linked / postgresResult.rows.length) * 100)}%`);

        if (linked === postgresResult.rows.length) {
            console.log('\n🎉 All users successfully migrated to Supabase Auth!');
            console.log('You can now safely remove sensitive data (email, password, phone).');
        } else {
            console.log('\n⏳ Migration in progress. Run the migration script to complete.');
        }

    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        pool.end();
    }
}

verifyMigration();
