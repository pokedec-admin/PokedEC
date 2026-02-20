const fs = require('fs');
const path = require('path');

const envDirectory = path.join(__dirname, '../src/environments');

if (!fs.existsSync(envDirectory)) {
    fs.mkdirSync(envDirectory, { recursive: true });
}

const targetPath = path.join(envDirectory, 'environment.prod.ts');

const envConfigFile = `export const environment = {
    production: true,
    version: '${process.env.APP_VERSION || 'V' + new Date().toISOString().split('T')[0].replace(/-/g, '.')}',
    apiUrl: '${process.env.API_URL || 'https://pokedec-backend.onrender.com/api'}',
    backupApiUrl: '',
    supabaseUrl: '${process.env.SUPABASE_URL || 'https://fkcktcwtnmuflasiueji.supabase.co'}',
    supabaseKey: '${process.env.SUPABASE_ANON_KEY || ''}'
};
`;

console.log('Generating environment.prod.ts...');
fs.writeFileSync(targetPath, envConfigFile);
console.log(`Environment file generated at ${targetPath}`);
