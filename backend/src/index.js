const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const authRoutes = require('./routes/auth').router;
const adminRoutes = require('./routes/admin');
const pokemonRoutes = require('./routes/pokedex');
const systemRoutes = require('./routes/system');
const { createUsersTable } = require('./models/user');
const { createPokedexTable } = require('./models/pokedex');
const { createPokemonNamesTable } = require('./models/pokemon_names');
const { createSuggestionsTable } = require('./models/suggestions');
const { createPokemonCategoryAvailabilityTable } = require('./models/pokemon_category_availability');
const { createClassificationsTable, createRegionsTable, createTypesTable } = require('./models/pokemon_references');
const { createPokemonMasterTable } = require('./models/pokemon_master');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Security Middleware
app.use(helmet());

// CORS Configuration
const allowedOrigins = [
  process.env.FRONTEND_URL, 'https://pokedec.ch', 'https://www.pokedec.ch',
  'http://localhost:4200',
  'http://localhost:4201',
  'http://localhost:8081'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Check if origin is in allowed list or matches Vercel preview pattern
    const isAllowed = allowedOrigins.indexOf(origin) !== -1 ||
      (/^https:\/\/pokedec-.*-pokedec-admins-projects\.vercel\.app$/.test(origin));

    if (!isAllowed) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/pokemon', pokemonRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/suggestions', require('./routes/suggestions'));
app.use('/api/admin/pokemon-categories', require('./routes/pokemon-categories'));
app.use('/api/pokemon-categories', require('./routes/public-categories'));
app.use('/api/admin/import', require('./routes/admin-import'));
app.use('/api/trade', require('./routes/trade'));
app.use('/api/admin', require('./routes/admin-pokemon')); // Pokemon master data management

const poolConfig = process.env.DATABASE_URL
  ? {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  }
  : {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
    ssl: { rejectUnauthorized: false }
  };

const pool = new Pool(poolConfig);

// Make pool available to routes
app.locals.pool = pool;

// Auto-migration function - ULTRA ROBUST VERSION
async function runMigrations() {
  console.log('🔄 Running auto-migrations...');

  const runStep = async (name, query, params = []) => {
    try {
      await pool.query(query, params);
      console.log(`  ✅ ${name} completed`);
    } catch (e) {
      if (e.message.includes('already exists') || e.message.includes('already a column')) {
        console.log(`  ℹ️  ${name} already done`);
      } else {
        console.error(`  ⚠️  ${name} failed:`, e.message);
      }
    }
  };

  try {
    console.log('📦 Creating base tables...');
    await createUsersTable(pool);
    await createPokemonMasterTable(pool);
    await createPokedexTable(pool);
    await createPokemonNamesTable(pool);
    await createSuggestionsTable(pool);
    await createPokemonCategoryAvailabilityTable(pool);
    await createClassificationsTable(pool);
    await createRegionsTable(pool);
    await createTypesTable(pool);

    console.log('🛠️ Applying structural updates...');
    // Ensure trainer_name is NOT NULL
    await runStep('users.trainer_name_not_null', 'ALTER TABLE users ALTER COLUMN trainer_name SET NOT NULL');

    // Ensure email is NOT UNIQUE if it's shared between Supabase accounts (rare but possible during migrations)
    // Actually we keep it unique but handle the linking.
    await runStep('users.email_un-unique', 'ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key');

    // Drop old columns if they exist
    await runStep('users.address_country_drop', 'ALTER TABLE users DROP COLUMN IF EXISTS address_country');

    // Add new columns for auth sync if missing
    await runStep('Add supabase_uid to users', 'ALTER TABLE users ADD COLUMN IF NOT EXISTS supabase_uid VARCHAR(255) UNIQUE');

    // Migrate data from supabase_id to supabase_uid if needed
    try {
      const checkCol = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='supabase_id'");
      if (checkCol.rows.length > 0) {
        console.log('🔄 Migrating supabase_id to supabase_uid...');
        await pool.query('UPDATE users SET supabase_uid = supabase_id WHERE supabase_uid IS NULL AND supabase_id IS NOT NULL');
      }
    } catch (e) {
      console.error('  ⚠️  Migration from supabase_id failed:', e.message);
    }

    // Pokemon Master structural updates
    await runStep('pca.columns', 'ALTER TABLE pokemon_category_availability ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT false');

    // Pokedex structural updates
    await runStep('pokedex.columns', 'ALTER TABLE pokedex ADD COLUMN IF NOT EXISTS is_shiny BOOLEAN DEFAULT false, ADD COLUMN IF NOT EXISTS is_lucky BOOLEAN DEFAULT false');
    await runStep('pokedex.unique', 'ALTER TABLE pokedex ADD CONSTRAINT pokedex_user_id_pokemon_id_key UNIQUE (user_id, pokemon_id)');

    // Pokemon Master data columns
    await runStep('pm.columns', 'ALTER TABLE pokemon_master ADD COLUMN IF NOT EXISTS is_mega BOOLEAN DEFAULT false, ADD COLUMN IF NOT EXISTS is_gmax BOOLEAN DEFAULT false');
    await runStep('pm.regional', 'ALTER TABLE pokemon_master ADD COLUMN IF NOT EXISTS is_regional BOOLEAN DEFAULT false');
    await runStep('pm.reg_desc', 'ALTER TABLE pokemon_master ADD COLUMN IF NOT EXISTS region_description TEXT');

    // Fix IDs if they are strings in some places but ints in master
    await runStep('pokemon_master.id', 'ALTER TABLE pokemon_master ALTER COLUMN id TYPE INTEGER USING id::integer');

    // Ensure form column exists in pokedex
    await runStep('pokedex.form_col', 'ALTER TABLE pokedex ADD COLUMN IF NOT EXISTS form VARCHAR(50) DEFAULT NULL');

    console.log('✅ Auto-migrations completed!');
  } catch (err) {
    console.error('❌ Migration Critical Error:', err);
  }
}

// Database Connection State Cache
let dbInitialized = false;

// Initialize Database connection and run migrations in background
async function initDB() {
  try {
    const client = await pool.connect();
    console.log('✅ Database connected');
    client.release();

    // Run migrations
    await runMigrations();

    // Trigger classifications sync in background
    require('./models/pokemon_references').syncInitialData(pool).catch(e => console.error('Ref sync error:', e));

    dbInitialized = true;
    console.log('✅ Background initializations completed');
  } catch (err) {
    console.error('❌ Database initialization error:', err);
    // Don't exit process, let retry happen or healthcheck fail
  }
}

initDB();

// Health Check with DB status
app.get('/api/health', async (req, res) => {
  try {
    const dbStatus = dbInitialized ? 'connected' : 'connecting';
    res.json({
      status: 'ok',
      database: dbStatus,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Serve static images
app.use('/images', express.static(path.join(__dirname, '../public/images')));

app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
