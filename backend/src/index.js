const express = require('express');
const Sentry = require('@sentry/node');
const { nodeProfilingIntegration } = require('@sentry/profiling-node');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const { Pool } = require('pg');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const authRoutes = require('./routes/auth').router;
const adminRoutes = require('./routes/admin');
const adminImportRoutes = require('./routes/admin-import');
const pokemonRoutes = require('./routes/pokedex');
const systemRoutes = require('./routes/system');
const { createTrainersTable } = require('./models/trainer');
const { createPokedexTable } = require('./models/pokedex');
const { createSuggestionsTable } = require('./models/suggestions');
const { createAuditLogsTable, createAuditTriggerFunction, applyAuditTriggerToPokedex } = require('./models/audit');
const { createPokemonCategoryAvailabilityTable } = require('./models/pokemon_category_availability');
const { createClassificationsTable, createRegionsTable, createTypesTable } = require('./models/pokemon_references');
const { createPokemonMasterTable } = require('./models/pokemon_master');
const fs = require('fs');
const path = require('path');

const app = express();
app.set("trust proxy", 1);

// Sentry Initialization
Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [
        nodeProfilingIntegration(),
    ],
    // Performance Monitoring
    tracesSampleRate: 1.0, //  Capture 100% of the transactions
    // Set sampling rate for profiling - this is relative to tracesSampleRate
    profilesSampleRate: 1.0,
});

// Swagger Configuration

// Swagger Configuration
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: "Poked'EC API",
            version: '1.0.0',
            description: 'API for PokedEC application',
        },
        servers: [
            { url: process.env.BACKEND_URL || 'http://localhost:8080' }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                }
            }
        },
        security: [{
            bearerAuth: []
        }]
    },
    apis: ['./src/routes/*.js'], // Path to the API docs
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
// The error handler must be after all controllers but before any other error middleware
Sentry.setupExpressErrorHandler(app);

// Custom error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

const PORT = process.env.PORT || 3000;

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://fkcktcwtnmuflasiueji.supabase.co"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https://fkcktcwtnmuflasiueji.supabase.co", "https://*.supabase.co"],
      connectSrc: ["'self'", "https://fkcktcwtnmuflasiueji.supabase.co", "https://*.supabase.co", "https://pokedec-backend.onrender.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS Configuration
const allowedOrigins = [
  process.env.FRONTEND_URL, 'https://pokedec.ch', 'https://www.pokedec.ch',
  'http://localhost:4200',
  'http://localhost:4201',
  'http://localhost:8080',
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

// Specific Admin routes first
app.use('/api/admin/import', adminImportRoutes);
app.use('/api/admin/pokemon-categories', require('./routes/pokemon-categories'));

// General Admin routes
app.use('/api/admin', adminRoutes);
app.use('/api/admin', require('./routes/admin-pokemon')); // Pokemon master data management

// Other routes
app.use('/api/pokemon', pokemonRoutes);
app.use('/api/pokemon-categories', require('./routes/public-categories'));
app.use('/api/system', systemRoutes);
app.use('/api/suggestions', require('./routes/suggestions'));
app.use('/api/trade', require('./routes/trade'));

const poolConfig = process.env.DATABASE_URL
  ? {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false }
  }
  : {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
    ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false }
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
    // Check for table name consistency
    const tableCheck = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('users', 'trainers')");
    const existingTables = tableCheck.rows.map(r => r.table_name);
    if (existingTables.includes('users') && !existingTables.includes('trainers')) {
      console.log('🔄 Auto-renaming users to trainers...');
      await pool.query('ALTER TABLE users RENAME TO trainers');
    }
    await createTrainersTable(pool);
    await createPokemonMasterTable(pool);
    await createPokedexTable(pool);
    await createSuggestionsTable(pool);
    await createPokemonCategoryAvailabilityTable(pool);
    await createClassificationsTable(pool);
    await createRegionsTable(pool);
    await createTypesTable(pool);

    console.log('🛠️ Applying structural updates...');
    // Ensure trainer_name is NOT NULL
    await runStep('trainers.trainer_name_not_null', 'ALTER TABLE trainers ALTER COLUMN trainer_name SET NOT NULL');

    // Ensure email is NOT UNIQUE if it's shared between Supabase accounts (rare but possible during migrations)
    // Actually we keep it unique but handle the linking.
    await runStep('trainers.email_un-unique', 'ALTER TABLE trainers DROP CONSTRAINT IF EXISTS users_email_key');

    // Drop old columns if they exist
    await runStep('trainers.address_country_drop', 'ALTER TABLE trainers DROP COLUMN IF EXISTS address_country');

    // Add new columns for auth sync if missing
    await runStep('Add supabase_uid to trainers', 'ALTER TABLE trainers ADD COLUMN IF NOT EXISTS supabase_uid VARCHAR(255) UNIQUE');
    await runStep('Add trade_preference to trainers', 'ALTER TABLE trainers ADD COLUMN IF NOT EXISTS trade_preference TEXT');
    await runStep('Add is_active to trainers', 'ALTER TABLE trainers ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true');

    // Add indexes for performance
    await runStep('trainers.idx_supabase_uid', 'CREATE INDEX IF NOT EXISTS idx_trainers_supabase_uid ON trainers(supabase_uid)');
    await runStep('trainers.idx_email', 'CREATE INDEX IF NOT EXISTS idx_trainers_email ON trainers(email)');

    console.log('🛡️ Setting up Audit Logs...');
    await createAuditLogsTable(pool);
    await createAuditTriggerFunction(pool);
    await applyAuditTriggerToPokedex(pool);

    console.log('🔍 Enabling Search Optimizations...');
    await runStep('pg_trgm', 'CREATE EXTENSION IF NOT EXISTS pg_trgm');
    await runStep('pokemon_master.idx_name_fr_trgm', 'CREATE INDEX IF NOT EXISTS idx_pm_name_fr_trgm ON pokemon_master USING gin (name_fr gin_trgm_ops)');
    await runStep('pokemon_master.idx_name_en_trgm', 'CREATE INDEX IF NOT EXISTS idx_pm_name_en_trgm ON pokemon_master USING gin (name_en gin_trgm_ops)');

    // Migrate data from supabase_id to supabase_uid if needed
    try {
      const checkCol = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='trainers' AND column_name='supabase_id'");
      if (checkCol.rows.length > 0) {
        console.log('🔄 Migrating supabase_id to supabase_uid...');
        await pool.query('UPDATE trainers SET supabase_uid = supabase_id WHERE supabase_uid IS NULL AND supabase_id IS NOT NULL');
      }
    } catch (e) {
      console.error('  ⚠️  Migration from supabase_id failed:', e.message);
    }

    // Pokemon Master structural updates
    await runStep('pca.columns', 'ALTER TABLE pokemon_category_availability ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT false, ADD COLUMN IF NOT EXISTS form_name VARCHAR(50) DEFAULT \'Normal\', ADD COLUMN IF NOT EXISTS can_be_legendary BOOLEAN DEFAULT false, ADD COLUMN IF NOT EXISTS can_be_mythical BOOLEAN DEFAULT false, ADD COLUMN IF NOT EXISTS can_be_ultra_beast BOOLEAN DEFAULT false');
    await runStep('pca.composite_pk', 'ALTER TABLE pokemon_category_availability DROP CONSTRAINT IF EXISTS pokemon_category_availability_pkey, ADD CONSTRAINT pokemon_category_availability_pkey PRIMARY KEY (pokemon_id, form_name)');

    // Pokedex structural updates

    // Pokemon Master data columns
    await runStep('pm.columns', 'ALTER TABLE pokemon_master ADD COLUMN IF NOT EXISTS is_mega BOOLEAN DEFAULT false, ADD COLUMN IF NOT EXISTS is_gmax BOOLEAN DEFAULT false');
    await runStep('pm.regional', 'ALTER TABLE pokemon_master ADD COLUMN IF NOT EXISTS is_regional BOOLEAN DEFAULT false');
    await runStep('pm.reg_desc', 'ALTER TABLE pokemon_master ADD COLUMN IF NOT EXISTS region_description TEXT');

    // Fix IDs if they are strings in some places but ints in master
    await runStep('pokemon_master.id', 'ALTER TABLE pokemon_master ALTER COLUMN id TYPE INTEGER USING id::integer');

    // Ensure form column exists in pokedex
    await runStep('pokedex.columns', 'ALTER TABLE pokedex ADD COLUMN IF NOT EXISTS is_shiny BOOLEAN DEFAULT false, ADD COLUMN IF NOT EXISTS is_lucky BOOLEAN DEFAULT false');
    await runStep('pokedex.form_col', 'ALTER TABLE pokedex ADD COLUMN IF NOT EXISTS form VARCHAR(50) DEFAULT NULL, ADD COLUMN IF NOT EXISTS form_name VARCHAR(50) DEFAULT \'Normal\'');

    // Relax NOT NULL on name since it's now redundant (moved to master)
    await runStep('pokedex.relax_name', 'ALTER TABLE pokedex ALTER COLUMN name DROP NOT NULL');

    await runStep('pokedex.deduplicate', "DELETE FROM pokedex p1 WHERE p1.id < ANY (SELECT p2.id FROM pokedex p2 WHERE p1.user_id = p2.user_id AND p1.pokemon_id = p2.pokemon_id AND COALESCE(p1.form_name, '') = COALESCE(p2.form_name, '') AND p1.id <> p2.id)");
    await runStep('pokedex.drop_old_unique', 'ALTER TABLE pokedex DROP CONSTRAINT IF EXISTS pokedex_user_id_pokemon_id_key');
    await runStep('pokedex.drop_old_unique2', 'ALTER TABLE pokedex DROP CONSTRAINT IF EXISTS pokedex_user_id_pokemon_id_form_key');
    await runStep('pokedex.unique', 'ALTER TABLE pokedex ADD CONSTRAINT pokedex_user_id_pokemon_id_form_name_key UNIQUE (user_id, pokemon_id, form_name)');

    // Suggestions table structural updates
    await runStep('suggestions.archived_user', 'ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS archived_user BOOLEAN DEFAULT false');
    await runStep('suggestions.archived_admin', 'ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS archived_admin BOOLEAN DEFAULT false');
    await runStep('suggestions.is_read', 'ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false');
    await runStep('suggestions.email', 'ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS email VARCHAR(255)');

    // Trade requests table
    await runStep('trade_requests.create', `
      CREATE TABLE IF NOT EXISTS trade_requests (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        requester_id INTEGER NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
        target_user_id INTEGER NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
        pokemon_id INTEGER NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now(),
        UNIQUE (requester_id, target_user_id, pokemon_id)
      )
    `);
    await runStep('trade_requests.idx_target', 'CREATE INDEX IF NOT EXISTS idx_trade_requests_target ON trade_requests(target_user_id)');
    await runStep('trade_requests.idx_requester', 'CREATE INDEX IF NOT EXISTS idx_trade_requests_requester ON trade_requests(requester_id)');

    console.log('📈 Adding performance optimization indexes...');
    // Optimization indexes for pokedex
    await runStep('pokedex.idx_user_pokemon', 'CREATE INDEX IF NOT EXISTS idx_pokedex_user_pokemon ON pokedex(user_id, pokemon_id)');
    await runStep('pokedex.idx_variants', 'CREATE INDEX IF NOT EXISTS idx_pokedex_variants ON pokedex(has_shiny, has_lucky, has_xxl)');
    
    // Optimization indexes for suggestions
    await runStep('suggestions.idx_email', 'CREATE INDEX IF NOT EXISTS idx_suggestions_email ON suggestions(email)');
    await runStep('suggestions.idx_is_read', 'CREATE INDEX IF NOT EXISTS idx_suggestions_is_read ON suggestions(is_read)');

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

    // Sync users from Supabase Auth
    const { syncUsers } = require('./middleware/auth');
    syncUsers(pool).catch(e => console.error('User sync error:', e));

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
app.use('/images', express.static(path.join(__dirname, '../../frontend/public/images')));

app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
