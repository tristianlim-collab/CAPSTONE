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

  newContent = newContent.replace(/\bprotect\b/g, 'authenticate');

  if (content !== newContent) {
     fs.writeFileSync(file, newContent);
     console.log('Fixed protect to authenticate in:', file);
  }
}
