const express = require('express');
const router = express.Router();
const axios = require('axios');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { authenticateAdmin } = require('../middleware/auth');

// Configuration
const ENV_URLS = {
    DEV: 'http://localhost:8080',
    NAS: 'https://back.pokedec.ch',
    CLOUD: 'https://pokedec-backend.onrender.com'
};

// Helper to determine active environment
function getEnvironment() {
    if (process.env.APP_ENV) return process.env.APP_ENV;
    if (process.env.RENDER || process.env.RENDER_SERVICE_ID) return 'CLOUD';
    if (process.env.NODE_ENV === 'production') return 'CLOUD';
    return 'DEV';
}

// Helper to read version
function getVersion() {
    // Priority: Env Var > Package.json > Default
    if (process.env.APP_VERSION) return process.env.APP_VERSION;
    try {
        const pkgPath = path.join(__dirname, '../../package.json');
        if (fs.existsSync(pkgPath)) {
            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
            if (pkg.version) return pkg.version;
        }
    } catch (e) {
        console.error('Error reading package.json version:', e);
    }
    return 'V2026.08.11.2';
}

// GET /health - For Render monitoring
router.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// GET /status - Returns current instance info
router.get('/status', (req, res) => {
    res.json({
        env: getEnvironment(),
        version: getVersion(),
        timestamp: new Date().toISOString()
    });
});

// GET /monitoring - Probes all environments (Admin only)
router.get('/monitoring', authenticateAdmin, async (req, res) => {
    const results = {};
    const environments = ['DEV', 'NAS', 'CLOUD'];
    const currentEnv = getEnvironment();

    const probes = environments.map(async (env) => {
        // If it's the current environment, return status directly
        if (env === currentEnv) {
            return {
                env,
                url: ENV_URLS[env],
                status: 'ONLINE',
                version: getVersion(),
                activeEnv: currentEnv,
                responseTime: '0ms (self)'
            };
        }

        try {
            const url = ENV_URLS[env];
            const statusUrl = `${url}/api/system/status`;

            const startTime = Date.now();
            const response = await axios.get(statusUrl, { timeout: 3000 });
            const responseTime = Date.now() - startTime;

            return {
                env,
                url: url,
                status: 'ONLINE',
                version: response.data.version,
                activeEnv: response.data.env,
                responseTime: `${responseTime}ms`
            };
        } catch (error) {
            return {
                env,
                url: ENV_URLS[env],
                status: 'OFFLINE',
                error: error.message
            };
        }
    });

    try {
        const probeResults = await Promise.all(probes);
        probeResults.forEach(result => {
            results[result.env] = result;
        });
        res.json(results);
    } catch (err) {
        console.error('Monitoring error:', err);
        res.status(500).json({ error: 'Monitoring failed' });
    }
});

// POST /deploy - Trigger deployment (DEV only, Admin only)
router.post('/deploy', authenticateAdmin, (req, res) => {
    const currentEnv = getEnvironment();
    // Only allow deployment from DEV environment
    if (currentEnv !== 'DEV') {
        return res.status(403).json({ error: 'Deployment can only be triggered from DEV environment' });
    }

    const target = 'nas'; // Hardcoded to nas since we removed blue/green

    // Execute shell script
    // Note: In Docker, we mount deployment assets to /deployment
    const scriptPath = '/deployment/deploy/deploy-synology.sh';
    const command = `${scriptPath} ${target}`;

    console.log(`🚀 Triggering deployment to ${target}...`);
    console.log(`📂 Script path: ${scriptPath}`);

    // Check if script exists
    if (!fs.existsSync(scriptPath)) {
        console.error(`❌ Script not found: ${scriptPath}`);
        return res.status(500).json({
            error: 'Deployment script not found',
            path: scriptPath,
            message: 'SSH tools may not be available in this container'
        });
    }

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`❌ Deployment error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`⚠️ Deployment stderr: ${stderr}`);
        }
        console.log(`✅ Deployment stdout: ${stdout}`);
    });

    res.json({ message: `Deployment to ${target} started`, command });
});

module.exports = router;
