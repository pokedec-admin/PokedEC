const fs = require('fs');
const path = require('path');

const replacement = `const poolConfig = process.env.DATABASE_URL 
    ? { 
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      }
    : {
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'db',
        database: process.env.DB_NAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        port: process.env.DB_PORT || 5432,
      };

const pool = new Pool(poolConfig);`;

const targetDir = path.join(__dirname, 'src/routes');
const files = fs.readdirSync(targetDir);

files.forEach(file => {
    if (file.endsWith('.js')) {
        const filePath = path.join(targetDir, file);
        let content = fs.readFileSync(filePath, 'utf8');

        // Match the old multi-line Pool creation
        const regex = /const pool = new Pool\(\{[\s\S]*?\}\);/g;
        if (regex.test(content)) {
            console.log(`Fixing Pool in ${file}`);
            content = content.replace(regex, replacement);
            fs.writeFileSync(filePath, content);
        }
    }
});
