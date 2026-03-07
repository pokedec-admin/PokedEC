const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateAdmin, supabase } = require('../middleware/auth');
const sharp = require('sharp');
const fileType = require('file-type');

// ==================== POKEMON MASTER ROUTES ====================

// GET /api/admin/pokemon - List all Pokemon (master data)
router.get('/pokemon', authenticateAdmin, async (req, res) => {
    try {
        const pool = req.app.locals.pool;
        const { available, classification, region, type, is_regional, form_name } = req.query;

        let query = `
            SELECT 
                pm.*,
                c.name_fr as classification_name,
                r.name_fr as region_name,
                t1.name_fr as type_primary_name,
                t1.color_hex as type_primary_color,
                t2.name_fr as type_secondary_name,
                t2.color_hex as type_secondary_color
            FROM pokemon_master pm
            LEFT JOIN classifications c ON pm.classification_id = c.id
            LEFT JOIN regions r ON pm.region_id = r.id
            LEFT JOIN types t1 ON pm.type_primary_id = t1.id
            LEFT JOIN types t2 ON pm.type_secondary_id = t2.id
            WHERE 1=1
        `;

        const params = [];
        let paramIndex = 1;

        if (available !== undefined) {
            query += ` AND pm.is_available = $${paramIndex}`;
            params.push(available === 'true');
            paramIndex++;
        }

        if (classification) {
            query += ` AND pm.classification_id = $${paramIndex}`;
            params.push(parseInt(classification));
            paramIndex++;
        }

        if (region) {
            query += ` AND pm.region_id = $${paramIndex}`;
            params.push(parseInt(region));
            paramIndex++;
        }

        if (type) {
            query += ` AND (pm.type_primary_id = $${paramIndex} OR pm.type_secondary_id = $${paramIndex})`;
            params.push(parseInt(type));
            paramIndex++;
        }

        if (is_regional !== undefined) {
            query += ` AND pm.is_regional = $${paramIndex}`;
            params.push(is_regional === 'true');
            paramIndex++;
        }

        if (form_name) {
            query += ` AND pm.form_name = $${paramIndex}`;
            params.push(form_name);
            paramIndex++;
        }

        query += ' ORDER BY pm.pokemon_id ASC, pm.form_name ASC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching Pokemon list:', error);
        res.status(500).json({ error: 'Failed to fetch Pokemon list' });
    }
});

// GET /api/admin/pokemon/species/:pokemon_id - Get all forms for a species
router.get('/pokemon/species/:pokemon_id', authenticateAdmin, async (req, res) => {
    try {
        const pool = req.app.locals.pool;
        const { pokemon_id } = req.params;

        const query = `
            SELECT 
                pm.*,
                c.name_fr as classification_name, c.name_key as classification_key,
                r.name_fr as region_name, r.name_key as region_key,
                t1.name_fr as type_primary_name, t1.name_key as type_primary_key, t1.color_hex as type_primary_color,
                t2.name_fr as type_secondary_name, t2.name_key as type_secondary_key, t2.color_hex as type_secondary_color,
                pca.can_be_normal, pca.can_be_legendary, pca.can_be_mythical, pca.can_be_ultra_beast,
                pca.can_be_shiny, pca.can_be_lucky, pca.can_be_xxl, pca.can_be_xxs,
                pca.can_be_gmax, pca.can_be_dynamax, pca.can_be_mega,
                pca.can_be_obscure, pca.can_be_purified, pca.can_be_perfect
            FROM pokemon_master pm
            LEFT JOIN classifications c ON pm.classification_id = c.id
            LEFT JOIN regions r ON pm.region_id = r.id
            LEFT JOIN types t1 ON pm.type_primary_id = t1.id
            LEFT JOIN types t2 ON pm.type_secondary_id = t2.id
            LEFT JOIN pokemon_category_availability pca ON pm.pokemon_id = pca.pokemon_id AND pm.form_name = pca.form_name
            WHERE pm.pokemon_id = $1
            ORDER BY 
                CASE WHEN pm.form_name = 'Normal' THEN 0 ELSE 1 END,
                pm.form_name ASC
        `;

        const result = await pool.query(query, [pokemon_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Pokemon species not found' });
        }

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching Pokemon forms:', error);
        res.status(500).json({ error: 'Failed to fetch Pokemon forms' });
    }
});

// GET /api/admin/pokemon/species/:pokemon_id/:form_name - Get specific form
router.get('/pokemon/species/:pokemon_id/:form_name', authenticateAdmin, async (req, res) => {
    try {
        const pool = req.app.locals.pool;
        const { pokemon_id, form_name } = req.params;

        const query = `
            SELECT 
                pm.*,
                c.name_fr as classification_name, c.name_key as classification_key,
                r.name_fr as region_name, r.name_key as region_key,
                t1.name_fr as type_primary_name, t1.name_key as type_primary_key, t1.color_hex as type_primary_color,
                t2.name_fr as type_secondary_name, t2.name_key as type_secondary_key, t2.color_hex as type_secondary_color,
                pca.can_be_normal, pca.can_be_legendary, pca.can_be_mythical, pca.can_be_ultra_beast,
                pca.can_be_shiny, pca.can_be_lucky, pca.can_be_xxl, pca.can_be_xxs,
                pca.can_be_gmax, pca.can_be_dynamax, pca.can_be_mega,
                pca.can_be_obscure, pca.can_be_purified, pca.can_be_perfect
            FROM pokemon_master pm
            LEFT JOIN classifications c ON pm.classification_id = c.id
            LEFT JOIN regions r ON pm.region_id = r.id
            LEFT JOIN types t1 ON pm.type_primary_id = t1.id
            LEFT JOIN types t2 ON pm.type_secondary_id = t2.id
            LEFT JOIN pokemon_category_availability pca ON pm.pokemon_id = pca.pokemon_id AND pm.form_name = pca.form_name
            WHERE pm.pokemon_id = $1 AND pm.form_name = $2
        `;

        const result = await pool.query(query, [pokemon_id, form_name]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Pokemon form not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching Pokemon form:', error);
        res.status(500).json({ error: 'Failed to fetch Pokemon form' });
    }
});

// GET /api/admin/pokemon/:id - Get Pokemon detail
router.get('/pokemon/:id', authenticateAdmin, async (req, res) => {
    try {
        const pool = req.app.locals.pool;
        const { id } = req.params;

        const query = `
            SELECT 
                pm.*,
                c.name_fr as classification_name, c.name_key as classification_key,
                r.name_fr as region_name, r.name_key as region_key,
                t1.name_fr as type_primary_name, t1.name_key as type_primary_key, t1.color_hex as type_primary_color,
                t2.name_fr as type_secondary_name, t2.name_key as type_secondary_key, t2.color_hex as type_secondary_color,
                pca.can_be_normal, pca.can_be_legendary, pca.can_be_mythical, pca.can_be_ultra_beast,
                pca.can_be_shiny, pca.can_be_lucky, pca.can_be_xxl, pca.can_be_xxs,
                pca.can_be_gmax, pca.can_be_dynamax, pca.can_be_mega,
                pca.can_be_obscure, pca.can_be_purified, pca.can_be_perfect
            FROM pokemon_master pm
            LEFT JOIN classifications c ON pm.classification_id = c.id
            LEFT JOIN regions r ON pm.region_id = r.id
            LEFT JOIN types t1 ON pm.type_primary_id = t1.id
            LEFT JOIN types t2 ON pm.type_secondary_id = t2.id
            LEFT JOIN pokemon_category_availability pca ON pm.pokemon_id = pca.pokemon_id AND pm.form_name = pca.form_name
            WHERE pm.id = $1
        `;

        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Pokemon not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching Pokemon detail:', error);
        res.status(500).json({ error: 'Failed to fetch Pokemon detail' });
    }
});

// PUT /api/admin/pokemon/:id - Update Pokemon
router.put('/pokemon/:id', authenticateAdmin, async (req, res) => {
    try {
        const pool = req.app.locals.pool;
        const { id } = req.params;
        const {
            name_fr, name_en, name_de, name_it,
            is_available,
            classification_id,
            region_id,
            type_primary_id,
            type_secondary_id,
            trade_status,
            image_url,
            // Category flags
            can_be_normal,
            can_be_shiny,
            can_be_lucky,
            can_be_xxl,
            can_be_xxs,
            can_be_gmax,
            can_be_dynamax,
            can_be_mega,
            can_be_obscure,
            can_be_purified,
            can_be_perfect,
            is_regional,
            regional_description
        } = req.body;

        const userId = req.user.id;

        // Start transaction
        await pool.query('BEGIN');

        // 1. Update pokemon_master
        const updateMasterQuery = `
            UPDATE pokemon_master
            SET 
                name_fr = COALESCE($1, name_fr),
                name_en = COALESCE($2, name_en),
                name_de = COALESCE($3, name_de),
                name_it = COALESCE($4, name_it),
                is_available = COALESCE($5, is_available),
                classification_id = $6,
                region_id = $7,
                type_primary_id = $8,
                type_secondary_id = $9,
                trade_status = COALESCE($10, trade_status),
                image_url = COALESCE($11, image_url),
                is_regional = COALESCE($12, is_regional),
                regional_description = COALESCE($13, regional_description),
                updated_by = $14,
                updated_at = NOW()
            WHERE id = $15
            RETURNING *
        `;

        const masterResult = await pool.query(updateMasterQuery, [
            name_fr, name_en, name_de, name_it,
            is_available,
            classification_id,
            region_id,
            type_primary_id,
            type_secondary_id,
            trade_status,
            image_url,
            is_regional,
            regional_description,
            userId,
            id
        ]);

        if (masterResult.rows.length === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json({ error: 'Pokemon not found' });
        }

        // 2. Upsert pokemon_category_availability
        const upsertCategoryQuery = `
            INSERT INTO pokemon_category_availability (
                pokemon_id, form_name,
                can_be_normal,
                can_be_shiny, can_be_lucky, can_be_xxl, can_be_xxs,
                can_be_gmax, can_be_dynamax, can_be_mega,
                can_be_obscure, can_be_purified, can_be_perfect
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            ON CONFLICT (pokemon_id, form_name) DO UPDATE SET
                can_be_normal = EXCLUDED.can_be_normal,
                can_be_shiny = EXCLUDED.can_be_shiny,
                can_be_lucky = EXCLUDED.can_be_lucky,
                can_be_xxl = EXCLUDED.can_be_xxl,
                can_be_xxs = EXCLUDED.can_be_xxs,
                can_be_gmax = EXCLUDED.can_be_gmax,
                can_be_dynamax = EXCLUDED.can_be_dynamax,
                can_be_mega = EXCLUDED.can_be_mega,
                can_be_obscure = EXCLUDED.can_be_obscure,
                can_be_purified = EXCLUDED.can_be_purified,
                can_be_perfect = EXCLUDED.can_be_perfect
            RETURNING *
        `;

        const categoryResult = await pool.query(upsertCategoryQuery, [
            masterResult.rows[0].pokemon_id,
            masterResult.rows[0].form_name,
            can_be_normal ?? true,
            can_be_shiny ?? true,
            can_be_lucky ?? true,
            can_be_xxl ?? true,
            can_be_xxs ?? true,
            can_be_gmax ?? false,
            can_be_dynamax ?? false,
            can_be_mega ?? false,
            can_be_obscure ?? false,
            can_be_purified ?? false,
            can_be_perfect ?? true
        ]);

        await pool.query('COMMIT');

        // Combine results
        const updatedPokemon = {
            ...masterResult.rows[0],
            ...categoryResult.rows[0]
        };

        res.json(updatedPokemon);
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Error updating Pokemon:', error);
        res.status(500).json({ error: 'Failed to update Pokemon' });
    }
});

// POST /api/admin/pokemon/forms - Create a new form for a species
router.post('/pokemon/forms', authenticateAdmin, async (req, res) => {
    try {
        const pool = req.app.locals.pool;
        const { pokemon_id, form_name } = req.body;

        if (!pokemon_id || !form_name) {
            return res.status(400).json({ error: 'pokemon_id and form_name are required' });
        }

        // Check if form already exists
        const checkQuery = 'SELECT id FROM pokemon_master WHERE pokemon_id = $1 AND form_name = $2';
        const checkResult = await pool.query(checkQuery, [pokemon_id, form_name]);

        if (checkResult.rows.length > 0) {
            return res.status(409).json({ error: 'Form already exists' });
        }

        // Get base data from Normal form
        const baseQuery = 'SELECT * FROM pokemon_master WHERE pokemon_id = $1 AND form_name = $2';
        const baseResult = await pool.query(baseQuery, [pokemon_id, 'Normal']);

        if (baseResult.rows.length === 0) {
            return res.status(404).json({ error: 'Base Normal form not found for this species' });
        }

        const baseData = baseResult.rows[0];

        // Clone data for new form
        const insertQuery = `
            INSERT INTO pokemon_master (
                pokemon_id, form_name, 
                name_fr, name_en, name_de, name_it,
                classification_id, region_id, 
                type_primary_id, type_secondary_id,
                is_available, is_regional, regional_description,
                image_url
            ) VALUES (
                $1, $2,
                $3, $4, $5, $6,
                $7, $8,
                $9, $10,
                $11, $12, $13,
                $14
            ) RETURNING *
        `;

        // Update name to include form name (simple heuristic)
        const newNameFr = `${baseData.name_fr} (${form_name})`;
        const newNameEn = `${baseData.name_en} (${form_name})`;
        const newNameDe = `${baseData.name_de} (${form_name})`;
        const newNameIt = `${baseData.name_it} (${form_name})`;

        // Default image URL (local path convention)
        // Normalize form name to match upload logic
        const normalizeFormName = (name) => {
            return name
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/ /g, '_')
                .replace(/[^a-zA-Z0-9_-]/g, '');
        };
        const newImageUrl = `/images/pokemon/${pokemon_id}_${normalizeFormName(form_name)}.png`;

        const result = await pool.query(insertQuery, [
            pokemon_id, form_name,
            newNameFr, newNameEn, newNameDe, newNameIt,
            baseData.classification_id, baseData.region_id,
            baseData.type_primary_id, baseData.type_secondary_id,
            baseData.is_available, false, null,
            newImageUrl
        ]);

        res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error('Error creating Pokemon form:', error);
        res.status(500).json({ error: 'Failed to create Pokemon form' });
    }
});

// DELETE /api/admin/pokemon/forms/:pokemon_id/:form_name - Delete a specific form
router.delete('/pokemon/forms/:pokemon_id/:form_name', authenticateAdmin, async (req, res) => {
    try {
        const pool = req.app.locals.pool;
        const { pokemon_id, form_name } = req.params;

        if (!pokemon_id || !form_name) {
            return res.status(400).json({ error: 'pokemon_id and form_name are required' });
        }

        if (form_name === 'Normal') {
            return res.status(403).json({ error: 'Cannot delete the Normal form' });
        }

        // Start transaction
        await pool.query('BEGIN');

        // 1. Delete from pokedex (user data)
        await pool.query('DELETE FROM pokedex WHERE pokemon_id = $1 AND form_name = $2', [pokemon_id, form_name]);

        // 2. Delete from pokemon_category_availability
        await pool.query('DELETE FROM pokemon_category_availability WHERE pokemon_id = $1 AND form_name = $2', [pokemon_id, form_name]);

        // 3. Delete from pokemon_master
        const deleteResult = await pool.query('DELETE FROM pokemon_master WHERE pokemon_id = $1 AND form_name = $2 RETURNING image_url', [pokemon_id, form_name]);

        if (deleteResult.rows.length === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json({ error: 'Form not found' });
        }

        const imageUrl = deleteResult.rows[0].image_url;

        // 4. Update Normal form's category flags if needed
        let updateFlagsQuery = null;
        if (form_name === 'Gigamax') {
            updateFlagsQuery = 'UPDATE pokemon_category_availability SET can_be_gmax = false WHERE pokemon_id = $1 AND form_name = $2';
        } else if (form_name === 'Dynamax') {
            updateFlagsQuery = 'UPDATE pokemon_category_availability SET can_be_dynamax = false WHERE pokemon_id = $1 AND form_name = $2';
        } else if (form_name.startsWith('Méga') || form_name.startsWith('Mega')) {
            // Only deactivate Mega if no other Mega forms remain
            const otherMegaCheck = await pool.query(
                "SELECT id FROM pokemon_master WHERE pokemon_id = $1 AND (form_name LIKE 'Méga%' OR form_name LIKE 'Mega%') AND form_name != $2",
                [pokemon_id, form_name]
            );
            if (otherMegaCheck.rows.length === 0) {
                updateFlagsQuery = 'UPDATE pokemon_category_availability SET can_be_mega = false WHERE pokemon_id = $1 AND form_name = $2';
            }
        }

        if (updateFlagsQuery) {
            await pool.query(updateFlagsQuery, [pokemon_id, 'Normal']);
        }

        await pool.query('COMMIT');

        // Optional: Delete image file if it's local
        if (imageUrl && imageUrl.startsWith('/images/pokemon/')) {
            const filePath = path.join(__dirname, '../../../frontend/public', imageUrl);
            if (fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                } catch (err) {
                    console.error('Failed to delete image file:', err);
                }
            }
        }

        res.json({ message: 'Form deleted successfully' });
    } catch (error) {
        if (req.app.locals.pool) await req.app.locals.pool.query('ROLLBACK');
        console.error('Error deleting Pokemon form:', error);
        res.status(500).json({ error: 'Failed to delete Pokemon form' });
    }
});

// ==================== REFERENCE DATA ROUTES ====================

// GET /api/admin/classifications - List all classifications
router.get('/classifications', authenticateAdmin, async (req, res) => {
    try {
        const pool = req.app.locals.pool;
        const query = 'SELECT * FROM classifications ORDER BY display_order ASC';
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching classifications:', error);
        res.status(500).json({ error: 'Failed to fetch classifications' });
    }
});

// GET /api/admin/regions - List all regions
router.get('/regions', authenticateAdmin, async (req, res) => {
    try {
        const pool = req.app.locals.pool;
        const query = 'SELECT * FROM regions ORDER BY display_order ASC';
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching regions:', error);
        res.status(500).json({ error: 'Failed to fetch regions' });
    }
});

// POST /api/admin/regions - Create a new custom region
router.post('/regions', authenticateAdmin, async (req, res) => {
    try {
        const pool = req.app.locals.pool;
        const { name_fr, name_en, name_key } = req.body;

        if (!name_fr || !name_en || !name_key) {
            return res.status(400).json({ error: 'name_fr, name_en, and name_key are required' });
        }

        // Get max display_order
        const maxOrderQuery = 'SELECT MAX(display_order) as max_order FROM regions';
        const maxOrderResult = await pool.query(maxOrderQuery);
        const nextOrder = (maxOrderResult.rows[0].max_order || 0) + 1;

        const query = `
            INSERT INTO regions (name_key, name_fr, name_en, display_order, is_custom)
            VALUES ($1, $2, $3, $4, TRUE)
            RETURNING *
        `;

        const result = await pool.query(query, [name_key, name_fr, name_en, nextOrder]);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        if (error.code === '23505') { // Unique violation
            return res.status(409).json({ error: 'Region with this name_key already exists' });
        }
        console.error('Error creating region:', error);
        res.status(500).json({ error: 'Failed to create region' });
    }
});

// GET /api/admin/types - List all types
router.get('/types', authenticateAdmin, async (req, res) => {
    try {
        const pool = req.app.locals.pool;
        const query = 'SELECT * FROM types ORDER BY name_fr ASC';
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching types:', error);
        res.status(500).json({ error: 'Failed to fetch types' });
    }
});

// ==================== FORM NAMES MANAGEMENT ====================

// GET /api/admin/form-names - List all predefined form names
router.get('/form-names', authenticateAdmin, async (req, res) => {
    try {
        const pool = req.app.locals.pool;
        const query = 'SELECT * FROM form_names_predefined ORDER BY name ASC';
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching form names:', error);
        res.status(500).json({ error: 'Failed to fetch form names' });
    }
});

// POST /api/admin/form-names - Create a new predefined form name
router.post('/form-names', authenticateAdmin, async (req, res) => {
    try {
        const pool = req.app.locals.pool;
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }

        const query = `
            INSERT INTO form_names_predefined (name)
            VALUES ($1)
            RETURNING *
        `;

        const result = await pool.query(query, [name]);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        if (error.code === '23505') { // Unique violation
            return res.status(409).json({ error: 'Form name already exists' });
        }
        console.error('Error creating form name:', error);
        res.status(500).json({ error: 'Failed to create form name' });
    }
});

// DELETE /api/admin/form-names/:id - Delete a predefined form name
router.delete('/form-names/:id', authenticateAdmin, async (req, res) => {
    try {
        const pool = req.app.locals.pool;
        const { id } = req.params;

        const query = 'DELETE FROM form_names_predefined WHERE id = $1 RETURNING *';
        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Form name not found' });
        }

        res.json({ message: 'Form name deleted successfully' });
    } catch (error) {
        console.error('Error deleting form name:', error);
        res.status(500).json({ error: 'Failed to delete form name' });
    }
});

// ==================== IMAGE UPLOAD ====================

// Configure upload storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Path relative to backend/src/routes/ -> ../../../frontend/public/images/pokemon
        const uploadPath = path.join(__dirname, '../../../frontend/public/images/pokemon');
        // Ensure directory exists
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Use temp name, renamed in controller
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'temp-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// POST /api/admin/pokemon/upload-image
router.post('/pokemon/upload-image', authenticateAdmin, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        const { pokemon_id, form_name } = req.body;

        if (!pokemon_id || !form_name) {
            if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: 'pokemon_id and form_name are required' });
        }

        // 1. Read file buffer for validation and processing
        const fileBuffer = fs.readFileSync(req.file.path);

        // 2. MIME Validation using file-type
        const type = await fileType.fromBuffer(fileBuffer);
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        
        if (!type || !allowedTypes.includes(type.mime)) {
            if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: 'Invalid file type. Only JPEG, PNG, WEBP and GIF are allowed.' });
        }

        // 3. Image Processing using sharp
        // We will resize to a max of 400x400 while maintaining aspect ratio, and convert to png for consistency
        const processedBuffer = await sharp(fileBuffer)
            .resize(400, 400, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .png({ quality: 80, compressionLevel: 9 })
            .toBuffer();

        // Normalize form name: lowercase, remove accents, replace spaces with underscores
        const normalizeFormName = (name) => {
            return name
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/ /g, '_')
                .replace(/[^a-z0-9_-]/g, '');
        };

        const safeFormName = normalizeFormName(form_name);
        const finalFileName = `${pokemon_id}_${safeFormName}.png`; // Always .png after sharp processing

        // 4. Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from('pokemon')
            .upload(finalFileName, processedBuffer, {
                contentType: 'image/png',
                upsert: true
            });

        // Cleanup local temp file
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

        if (error) {
            console.error('Supabase Storage Error:', error);
            return res.status(500).json({ error: 'Failed to upload to Supabase Storage: ' + error.message });
        }

        // Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from('pokemon')
            .getPublicUrl(finalFileName);

        res.json({ imageUrl: publicUrl });

    } catch (error) {
        console.error('Error uploading image:', error);
        if (req.file && fs.existsSync(req.file.path)) {
            try { fs.unlinkSync(req.file.path); } catch (e) { }
        }
        res.status(500).json({ error: 'Failed to upload image' });
    }
});

module.exports = router;
