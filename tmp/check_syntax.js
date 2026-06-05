
import fs from 'fs';
import { parse } from '@babel/parser';

const files = [
  'frontend/src/pages/response/ResponseMap.jsx',
  'frontend/src/pages/response/ResponseIncidents.jsx',
  'frontend/src/components/layout/ResponseLayout.jsx'
];

files.forEach(file => {
  try {
    const code = fs.readFileSync(file, 'utf8');
    parse(code, {
      sourceType: 'module',
      plugins: ['jsx']
    });
    console.log(`${file}: OK`);
  } catch (e) {
    console.error(`${file}: ERROR at line ${e.loc.line}, column ${e.loc.column}: ${e.message}`);
  }
});
