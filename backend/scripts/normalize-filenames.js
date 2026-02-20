const fs = require('fs');
const path = require('path');

const targetDir = process.argv[2] || '/frontend/public/images/pokemon';

if (!fs.existsSync(targetDir)) {
    console.error(`Directory not found: ${targetDir}`);
    process.exit(1);
}

function normalize(name) {
    return name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/ /g, '_')
        .replace(/[^a-zA-Z0-9._-]/g, '');
}

const files = fs.readdirSync(targetDir);
let count = 0;

files.forEach(file => {
    const oldPath = path.join(targetDir, file);
    const newName = normalize(file);
    const newPath = path.join(targetDir, newName);

    if (oldPath !== newPath) {
        if (fs.existsSync(newPath)) {
            fs.unlinkSync(oldPath); // Duplicate after normalization (e.g. "Méga" and "Mega")
            console.log(`Deleted duplicate: ${file}`);
        } else {
            fs.renameSync(oldPath, newPath);
            console.log(`Renamed: ${file} -> ${newName}`);
        }
        count++;
    }
});

console.log(`Finished. Normalized ${count} files.`);
