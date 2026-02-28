const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const poolConfig = process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false }
    }
    : {
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'db',
        database: process.env.DB_NAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        port: process.env.DB_PORT || 5432,
    };

const pool = new Pool(poolConfig);

async function createDefaultAdmin() {
    try {
        console.log('[Migration] Checking for existing admin user...');

        // Check if any admin exists
        const adminCheck = await pool.query('SELECT id FROM trainers WHERE is_admin = true');

        if (adminCheck.rows.length > 0) {
            console.log('[Migration] Admin user already exists. Skipping creation.');
            process.exit(0);
        }

        console.log('[Migration] No admin found. Creating default admin user...');

        const email = 'admin@pokedec.com';
        const password = 'admin123';
        const hashedPassword = await bcrypt.hash(password, 10);
        const trainerName = 'Admin';
        const team = 'Harmony';

        await pool.query(
            `INSERT INTO trainers (email, password, trainer_name, team, is_admin, email_verified, preferred_language)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [email, hashedPassword, trainerName, team, true, true, 'fr']
        );

        console.log(`[Migration] Default admin created successfully.`);
        console.log(`[Migration] Email: ${email}`);
        console.log(`[Migration] Password: ${password}`);

        process.exit(0);
    } catch (err) {
        console.error('[Migration] Error:', err);
        process.exit(1);
    }
}

createDefaultAdmin();
