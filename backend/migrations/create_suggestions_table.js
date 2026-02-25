const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

async function createSuggestionsTable() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS suggestions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES trainers(id),
                type VARCHAR(50) NOT NULL, -- 'suggestion' or 'bug'
                content TEXT NOT NULL,
                status VARCHAR(50) DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
                admin_response TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Suggestions table created successfully');
    } catch (err) {
        console.error('Error creating suggestions table:', err);
    } finally {
        await pool.end();
    }
}

createSuggestionsTable();
