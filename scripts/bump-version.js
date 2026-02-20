const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, 'frontend/src/environments/environment.ts');
const prodEnvPath = path.join(__dirname, 'frontend/src/environments/environment.prod.ts');

const type = process.argv[2]; // --dev or --prod

if (!type || (type !== '--dev' && type !== '--prod')) {
    console.error('Usage: node bump-version.js --dev | --prod');
    process.exit(1);
}

function readVersion(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const match = content.match(/version:\s*'V(\d{4})\.(\d{1,2})\.(\d+)(?:\.(\d+))?'/);
    if (!match) return null;
    return {
        full: match[0],
        year: parseInt(match[1]),
        month: parseInt(match[2]),
        prodCount: parseInt(match[3]),
        devCount: match[4] ? parseInt(match[4]) : 0,
        content: content
    };
}

const currentDev = readVersion(envPath);
const currentProd = readVersion(prodEnvPath);

if (!currentDev || !currentProd) {
    console.error('Could not parse version from environment files.');
    process.exit(1);
}

const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth() + 1;

let newYear = currentDev.year;
let newMonth = currentDev.month;
let newProdCount = currentDev.prodCount;
let newDevCount = currentDev.devCount;

// Check for month rollover
if (currentYear !== newYear || currentMonth !== newMonth) {
    newYear = currentYear;
    newMonth = currentMonth;
    newProdCount = 1; // Reset counts for new month? User didn't specify, but implies "dans le mois"
    newDevCount = 0;
}

if (type === '--dev') {
    newDevCount++;
} else if (type === '--prod') {
    newProdCount++;
    newDevCount = 0; // Reset dev count on prod release? Or keep it? Usually reset.
}

const newDevVersion = `V${newYear}.${newMonth}.${newProdCount}.${newDevCount}`;
const newProdVersion = `V${newYear}.${newMonth}.${newProdCount}`;

// Update environment.ts (DEV)
const newDevContent = currentDev.content.replace(
    /version:\s*'[^']+'/,
    `version: '${newDevVersion}'`
);
fs.writeFileSync(envPath, newDevContent);
console.log(`Updated DEV version to ${newDevVersion}`);

// Update environment.prod.ts (PROD) - always update to match the prod count
const newProdContent = currentProd.content.replace(
    /version:\s*'[^']+'/,
    `version: '${newProdVersion}'`
);
fs.writeFileSync(prodEnvPath, newProdContent);
console.log(`Updated PROD version to ${newProdVersion}`);
