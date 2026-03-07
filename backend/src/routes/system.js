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

// Helper to read version
function getVersion() {
    // Priority: Env Var > Package.json > Default
    if (process.env.APP_VERSION) return process.env.APP_VERSION;
    try {
        const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../../package.json'), 'utf8'));
        return pkg.version || 'V2026.03.07.1';
    } catch (e) {
        return 'V2026.03.07.1';
    }
}

// GET /health - For Render monitoring
router.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// GET /status - Returns current instance info
router.get('/status', (req, res) => {
    res.json({
        env: process.env.APP_ENV || 'UNKNOWN',
        version: getVersion(),
        timestamp: new Date().toISOString()
    });
});

// GET /monitoring - Probes all environments (Admin only)
router.get('/monitoring', authenticateAdmin, async (req, res) => {
    const results = {};
    const environments = ['DEV', 'NAS', 'CLOUD'];

    const probes = environments.map(async (env) => {
        // If it's the current environment, return status directly
        if (env === (process.env.APP_ENV || 'UNKNOWN')) {
            return {
                env,
                url: ENV_URLS[env],
                status: 'ONLINE',
                version: getVersion(),
                activeEnv: process.env.APP_ENV || 'UNKNOWN',
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
    // Only allow deployment from DEV environment
    if (process.env.APP_ENV !== 'DEV') {
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

module.exports = router;
