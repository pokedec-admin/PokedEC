const express = require('express');
const router = express.Router();
const axios = require('axios');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { authenticateAdmin } = require('../middleware/auth');

// Configuration
const ENV_URLS = {
    DEV: 'http://localhost:3000', // Local backend
    BLUE: 'http://192.168.1.199:8081', // NAS Blue
    GREEN: 'http://192.168.1.199:8080', // NAS Green
    PUBLIC: 'https://poke.fec.ch', // Public URL
    CLOUD: 'https://www.pokedec.ch' // Production Cloud
};

// Helper to read version
function getVersion() {
    // Priority: Env Var > Package.json > Default
    if (process.env.APP_VERSION) return process.env.APP_VERSION;
    try {
        const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../../package.json'), 'utf8'));
        return pkg.version || '0.8.0';
    } catch (e) {
        return '0.8.0';
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
    const environments = ['DEV', 'BLUE', 'GREEN', 'PUBLIC', 'CLOUD'];

    const probes = environments.map(async (env) => {
        try {
            const url = ENV_URLS[env];
            // For public/NAS, we hit the /api/system/status endpoint
            // Note: Public might need /api prefix depending on Nginx config
            const statusUrl = `${url}/api/system/status`;

            const startTime = Date.now();
            const response = await axios.get(statusUrl, { timeout: 2000 });
            const responseTime = Date.now() - startTime;

            return {
                env,
                url: env === 'DEV' ? 'http://localhost:8081' : url,
                status: 'ONLINE',
                version: response.data.version,
                activeEnv: response.data.env,
                responseTime: `${responseTime}ms`
            };
        } catch (error) {
            return {
                env,
                url: env === 'DEV' ? 'http://localhost:8081' : ENV_URLS[env],
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

    const { target } = req.body; // 'blue' or 'green'

    if (!['blue', 'green'].includes(target)) {
        return res.status(400).json({ error: 'Invalid target. Must be "blue" or "green".' });
    }

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

    // We don't wait for the script to finish, as it might take long
    // But we should probably spawn it detached or use a queue. 
    // For simplicity, we exec and log.
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

// POST /switch - Switch Public Environment (DEV only, Admin only)
router.post('/switch', authenticateAdmin, (req, res) => {
    // Only allow switch from DEV environment
    if (process.env.APP_ENV !== 'DEV') {
        return res.status(403).json({ error: 'Switching can only be triggered from DEV environment' });
    }

    const { target } = req.body; // 'blue' or 'green'

    if (!['blue', 'green'].includes(target)) {
        return res.status(400).json({ error: 'Invalid target. Must be "blue" or "green".' });
    }

    // Execute shell script
    const scriptPath = path.join(__dirname, '../../../deploy/switch-env.sh');
    const command = `${scriptPath} ${target}`;

    console.log(`🔄 Switching public environment to ${target}...`);

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`❌ Switch error: ${error.message}`);
            return res.status(500).json({ error: 'Switch failed', details: error.message });
        }
        res.json({ message: `Switched public environment to ${target}`, output: stdout });
    });
});

module.exports = router;
