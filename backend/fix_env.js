import fs from 'fs';
fs.writeFileSync('C:/Users/Tristan Zane/OneDrive/Desktop/CAPSTONE/frontend/.env', 'VITE_API_URL=http://localhost:3001/api\nVITE_MAPBOX_TOKEN=test\nVITE_SUPABASE_URL=test\nVITE_SUPABASE_ANON_KEY=test\n', 'utf8');
console.log('Done writing .env in UTF-8');
