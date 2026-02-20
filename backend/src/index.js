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
  process.env.FRONTEND_URL,
  'http://localhost:4200',
  'http://localhost:4201',
  'http://localhost:8081'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
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
      ssl: { rejectUnauthorized: false } // Required for Supabase/Render in prod
    }
  : {
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      port: process.env.DB_PORT || 5434,
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
    // 1. Create Base Tables
    console.log('📦 Creating base tables...');
    await pool.query(createUsersTable).catch(e => console.error('Error users:', e.message));
    await pool.query(createPokedexTable).catch(e => console.error('Error pokedex:', e.message));
    if (createPokemonNamesTable) await pool.query(createPokemonNamesTable).catch(e => { });
    if (createSuggestionsTable) await pool.query(createSuggestionsTable).catch(e => { });
    if (createPokemonCategoryAvailabilityTable) await pool.query(createPokemonCategoryAvailabilityTable).catch(e => { });

    if (createClassificationsTable) await createClassificationsTable().catch(e => { });
    if (createRegionsTable) await createRegionsTable().catch(e => { });
    if (createTypesTable) await createTypesTable().catch(e => { });
    if (createPokemonMasterTable) await createPokemonMasterTable().catch(e => { });

    console.log('🔧 Running schema repairs...');

    // Suggestions repairs (Essential for UI 500 errors)
    await runStep('suggestions.type', 'ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS type VARCHAR(50)');
    await runStep('suggestions.content', 'ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS content TEXT');
    await runStep('suggestions.status', "ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending'");
    await runStep('suggestions.admin_response', 'ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS admin_response TEXT');
    await runStep('suggestions.updated_at', 'ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
    await runStep('suggestions.archived_user', 'ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS archived_user BOOLEAN DEFAULT FALSE');
    await runStep('suggestions.archived_admin', 'ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS archived_admin BOOLEAN DEFAULT FALSE');

    // Users repairs
    await runStep('users.campfire_name', 'ALTER TABLE users ADD COLUMN IF NOT EXISTS campfire_name VARCHAR(255)');
    await runStep('users.whatsapp_group', 'ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_group VARCHAR(255)');
    await runStep('users.trainer_name_unique', 'ALTER TABLE users ADD CONSTRAINT unique_trainer_name UNIQUE (trainer_name)');
    await runStep('users.trainer_name_not_null', 'ALTER TABLE users ALTER COLUMN trainer_name SET NOT NULL');
    await runStep('users.email_un-unique', 'ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key');
    await runStep('users.address_country_drop', 'ALTER TABLE users DROP COLUMN IF EXISTS address_country');

    // Suggestions Data Migration
    try {
      const { rows: cols } = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'suggestions'");
      const names = cols.map(c => c.column_name);
      if (names.includes('category') && names.includes('type')) {
        await pool.query("UPDATE suggestions SET type = category WHERE type IS NULL");
        await pool.query("ALTER TABLE suggestions DROP COLUMN category");
      }
      if (names.includes('title') && names.includes('content')) {
        await pool.query("UPDATE suggestions SET content = CONCAT(title, ': ', description) WHERE content IS NULL");
        await pool.query("ALTER TABLE suggestions DROP COLUMN title");
        await pool.query("ALTER TABLE suggestions DROP COLUMN description");
      }
    } catch (e) { console.log('  ℹ️  Suggestions migration skipped'); }

    // PCA & Pokedex repairs
    await runStep('pca.columns', 'ALTER TABLE pokemon_category_availability ADD COLUMN IF NOT EXISTS can_be_dynamax BOOLEAN DEFAULT FALSE');
    await runStep('pokedex.columns', `ALTER TABLE pokedex ADD COLUMN IF NOT EXISTS has_parfait BOOLEAN DEFAULT FALSE, ADD COLUMN IF NOT EXISTS trade_perfect BOOLEAN DEFAULT FALSE, ADD COLUMN IF NOT EXISTS is_regional BOOLEAN DEFAULT FALSE`);
    await runStep('pokedex.unique', 'ALTER TABLE pokedex ADD CONSTRAINT pokedex_user_id_pokemon_id_key UNIQUE (user_id, pokemon_id)');

    // Pokemon Master repairs
    await runStep('pm.columns', 'ALTER TABLE pokemon_master ADD COLUMN IF NOT EXISTS form_name VARCHAR(50) DEFAULT \'Normal\'');
    await runStep('pm.regional', 'ALTER TABLE pokemon_master ADD COLUMN IF NOT EXISTS is_regional BOOLEAN DEFAULT FALSE');
    await runStep('pm.reg_desc', 'ALTER TABLE pokemon_master ADD COLUMN IF NOT EXISTS regional_description TEXT');

    // Constraints updates for Forms support
    // First, handle pokemon_master PK. Since we don't have many FKs to pokemon_id, it's relatively safe.
    try {
      const { rows: pkCheck } = await pool.query(`
        SELECT a.attname
        FROM pg_index i
        JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
        WHERE i.indrelid = 'pokemon_master'::regclass AND i.indisprimary;
      `);

      // Check if id column exists
      const { rows: idCheck } = await pool.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'pokemon_master' AND column_name = 'id';
      `);

      // If PK is on pokemon_id only OR composite (pokemon_id, form_name), and id doesn't exist
      if (idCheck.length === 0 && pkCheck.length > 0) {
        process.stdout.write('  🔧 Updating pokemon_master PK for forms...');
        await pool.query('ALTER TABLE pokemon_master DROP CONSTRAINT pokemon_master_pkey CASCADE');
        await pool.query('ALTER TABLE pokemon_master ADD COLUMN id SERIAL');
        await pool.query('ALTER TABLE pokemon_master ADD PRIMARY KEY (id)');
        await pool.query('ALTER TABLE pokemon_master ADD CONSTRAINT pokemon_master_unique_form UNIQUE (pokemon_id, form_name)');
        console.log(' DONE');
      } else if (idCheck.length > 0) {
        console.log('  ℹ️  pokemon_master.id already exists');
      }
    } catch (e) { console.error('  ⚠️ pokemon_master PK update failed:', e.message); }

    // PCA PK update
    try {
      const { rows: pkCheckPCA } = await pool.query(`
        SELECT a.attname
        FROM pg_index i
        JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
        WHERE i.indrelid = 'pokemon_category_availability'::regclass AND i.indisprimary;
      `);
      if (pkCheckPCA.length === 1 && pkCheckPCA[0].attname === 'pokemon_id') {
        process.stdout.write('  🔧 Updating PCA PK for forms...');
        await pool.query('ALTER TABLE pokemon_category_availability ADD COLUMN IF NOT EXISTS form_name VARCHAR(50) DEFAULT \'Normal\'');
        await pool.query('ALTER TABLE pokemon_category_availability DROP CONSTRAINT pokemon_category_availability_pkey');
        await pool.query('ALTER TABLE pokemon_category_availability ADD PRIMARY KEY (pokemon_id, form_name)');
        console.log(' DONE');
      }
    } catch (e) { console.error('  ⚠️ PCA PK update failed:', e.message); }

    // Pokedex unique constraint update
    await runStep('pokedex.form_col', 'ALTER TABLE pokedex ADD COLUMN IF NOT EXISTS form_name VARCHAR(50) DEFAULT \'Normal\'');
    try {
      const { rows: uniqueCheck } = await pool.query(`
        SELECT conname FROM pg_constraint WHERE conname = 'pokedex_user_id_pokemon_id_key'
      `);
      if (uniqueCheck.length > 0) {
        process.stdout.write('  🔧 Updating pokedex unique constraint for forms...');
        await pool.query('ALTER TABLE pokedex DROP CONSTRAINT pokedex_user_id_pokemon_id_key');
        await pool.query('ALTER TABLE pokedex ADD CONSTRAINT pokedex_user_id_pokemon_id_form_unique UNIQUE (user_id, pokemon_id, form_name)');
        console.log(' DONE');
      }
    } catch (e) { console.error('  ⚠️ pokedex constraint update failed:', e.message); }

    // 2. Data Population
    const { rows: userRows } = await pool.query('SELECT id FROM users LIMIT 1');
    if (userRows.length > 0) {
      const { rows: pokedexRows } = await pool.query('SELECT COUNT(*) FROM pokedex');
      if (parseInt(pokedexRows[0].count) < 10) {
        const importPath = path.join(__dirname, '../migrations/import_thebestcoyotte.sql');
        if (fs.existsSync(importPath)) {
          console.log('📄 Seeding initial Pokédex data...');
          const sql = fs.readFileSync(importPath, 'utf8');
          await pool.query(sql).catch(e => console.error('Seed error:', e.message));
        }
      }
    }

    // 3. Regional Data Seeding
    const { rows: regCheck } = await pool.query('SELECT COUNT(*) FROM pokemon_master WHERE is_regional = true');
    if (parseInt(regCheck[0].count) < 45) {
      const regionalPath = path.join(__dirname, '../migrations/populate_regional_data.sql');
      if (fs.existsSync(regionalPath)) {
        console.log('🌍 Seeding regional locations...');
        const sql = fs.readFileSync(regionalPath, 'utf8');
        const stmts = sql.split(';').filter(s => s.trim().length > 0);
        for (const s of stmts) { await pool.query(s).catch(e => { }); }
      }
    }

    // 4. Forms Data Seeding
    const { rows: formCheck } = await pool.query('SELECT COUNT(*) FROM pokemon_master WHERE form_name != \'Normal\'');
    if (parseInt(formCheck[0].count) < 50) {
      const formsPath = path.join(__dirname, '../migrations/populate_pokemon_forms.sql');
      if (fs.existsSync(formsPath)) {
        console.log('🌀 Seeding Pokémon forms...');
        const sql = fs.readFileSync(formsPath, 'utf8');
        const stmts = sql.split(';').filter(s => s.trim().length > 0);
        for (const s of stmts) {
          try {
            await pool.query(s);
          } catch (e) {
            // Ignore errors like "already exists" for individual statements
            if (!e.message.includes('already exists') && !e.message.includes('unique constraint')) {
              console.error('  ⚠️ Form seed error:', e.message);
            }
          }
        }
      }
    }

    console.log('✅ Auto-migrations completed!');
  } catch (err) {
    console.error('❌ Migration failure:', err.message);
  }
}

// Initialize Database with simplified migrations
pool.connect()
  .then(() => {
    console.log('✅ Database connected');
    return runMigrations();
  })
  .then(() => {
    console.log('🚀 Server ready to start');
    app.listen(PORT, () => {
      console.log(`Backend listening on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ Database connection error:', err);
    process.exit(1);
  });

module.exports = app;
