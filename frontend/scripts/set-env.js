const fs = require('fs');
const path = require('path');

const envDirectory = path.join(__dirname, '../src/environments');

if (!fs.existsSync(envDirectory)) {
    fs.mkdirSync(envDirectory, { recursive: true });
}

const targetPath = path.join(envDirectory, 'environment.prod.ts');

let supabaseUrl = process.env.SUPABASE_URL || 'https://fkcktcwtnmuflasiueji.supabase.co';
if (supabaseUrl && !supabaseUrl.startsWith('http')) {
    supabaseUrl = 'https://' + supabaseUrl;
}

const envConfigFile = `export const environment = {
    production: true,
    version: '${process.env.APP_VERSION || 'V' + new Date().toISOString().split('T')[0].replace(/-/g, '.') + '.14'}',
    apiUrl: '${process.env.API_URL || '/api'}',
    backupApiUrl: '/api',
    supabaseUrl: '${supabaseUrl}',
    supabaseKey: '${process.env.SUPABASE_ANON_KEY || 'sb_publishable_x-yC3GJsTNFqVacVzLKl0g_jEWhFOOl'}'
};
`;

console.log('Generating environment.prod.ts...');
fs.writeFileSync(targetPath, envConfigFile);
console.log(`Environment file generated at ${targetPath}`);
