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

  newContent = newContent.replace(/export const delete =/g, 'export const deleteItem =');
  newContent = newContent.replace(/controller\.delete(;|\)|,| )/g, 'controller.deleteItem$1');
  
  // also change `export const update =`? `export const update` is fine, `update` is not a reserved word.

  if (content !== newContent) {
     fs.writeFileSync(file, newContent);
     console.log('Fixed reserved word in:', file);
  }
}
