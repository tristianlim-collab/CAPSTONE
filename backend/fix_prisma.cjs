const fs = require('fs');
const _path = require('path');

const walk = (dir) => {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = _path.resolve(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) results = results.concat(walk(file));
        else if (file.endsWith('.js')) results.push(file);
    });
    return results;
};

const srcDir = _path.join(__dirname, 'src');
if (!fs.existsSync(srcDir)) {
    console.log('Skipping src dir not found', srcDir);
    process.exit(0);
}

const files = walk(srcDir);
let changedCount = 0;

files.forEach(file => {
    if (file.includes('config') && file.includes('database.js')) return;
    
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    const depth = file.split(_path.sep).length - srcDir.split(_path.sep).length;
    let relativePath = '';
    if (depth === 1) relativePath = './config/database.js';
    else if (depth === 2) relativePath = '../config/database.js';
    else if (depth === 3) relativePath = '../../config/database.js';

    let hasImport = false;
    let hasInstance = false;
    
    if (content.includes("import { PrismaClient } from '@prisma/client';")) {
        content = content.replace("import { PrismaClient } from '@prisma/client';", "");
        hasImport = true;
    }
    if (content.includes("import { PrismaClient } from \"@prisma/client\";")) {
        content = content.replace("import { PrismaClient } from \"@prisma/client\";", "");
        hasImport = true;
    }
    
    if (content.includes("const prisma = new PrismaClient();")) {
        content = content.replace("const prisma = new PrismaClient();", "");
        hasInstance = true;
    }

    if (hasImport || hasInstance) {
        content = `import { prisma } from '${relativePath}';\n` + content.replace(/^\s+/, '');
    }

    if (original !== content) {
        fs.writeFileSync(file, content);
        console.log('Fixed', file);
        changedCount++;
    }
});
console.log(`Updated ${changedCount} files.`);