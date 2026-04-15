const fs = require('fs');
const path = require('path');

function getFiles(dir, files = []) {
  const list = fs.readdirSync(dir);
  for(let file of list) {
    const name = path.join(dir, file);
    if(fs.statSync(name).isDirectory()) Object.assign(files, getFiles(name, files));
    else if(name.endsWith('.js')) files.push(name);
  }
  return files;
}

const jsFiles = getFiles('backend/src');
for(let file of jsFiles) {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content;

  // Change `exports.funcName =` to `export const funcName =`
  newContent = newContent.replace(/^exports\.([a-zA-Z0-9_]+)\s*=\s*/gm, 'export const $1 = ');
  
  // Change `import controller from '../controllers/...';` to `import * as controller from ...`
  newContent = newContent.replace(/import\s+([a-zA-Z0-9_]+)\s+from\s+(['"]\.\.?\/controllers\/.*?['"]);?/g, 'import * as $1 from $2;');

  if (content !== newContent) {
     fs.writeFileSync(file, newContent);
     console.log('Fixed exports in:', file);
  }
}
