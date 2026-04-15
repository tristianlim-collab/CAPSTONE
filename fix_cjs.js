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
  let newContent = content.replace(/const\s+({\s*[^}]+\s*})\s*=\s*require\((['"][^'"]+['"])\);?/g, 'import $1 from $2;');
  newContent = newContent.replace(/const\s+([a-zA-Z0-9_]+)\s*=\s*require\((['"][^'"]+['"])\);?/g, 'import $1 from $2;');
  newContent = newContent.replace(/module\.exports\s*=\s*([a-zA-Z0-9_]+);?/g, 'export default $1;');
  
  if (content !== newContent) {
     fs.writeFileSync(file, newContent);
     console.log('Fixed:', file);
  }
}
