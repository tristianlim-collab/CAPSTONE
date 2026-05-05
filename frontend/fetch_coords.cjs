const fs = require('fs');
const https = require('https');

const LGUS = [
  'Bacolod', 'Bago', 'Cadiz', 'Escalante', 'Himamaylan', 'Kabankalan', 'La Carlota', 'Sagay', 'San Carlos', 'Silay', 'Sipalay', 'Talisay', 'Victorias',
  'Binalbagan', 'Calatrava', 'Candoni', 'Cauayan', 'Enrique B. Magalona', 'Hinigaran', 'Hinoba-an', 'Ilog', 'Isabela', 'La Castellana', 'Manapla', 'Moises Padilla', 'Murcia', 'Pontevedra', 'Pulupandan', 'Salvador Benedicto', 'San Enrique', 'Toboso', 'Valladolid'
];

async function fetchCoords() {
  const results = [];
  for (const lgu of LGUS) {
    // Some LGUs need specific formatting for Nominatim
    let q = encodeURIComponent(`${lgu}, Negros Occidental, Philippines`);
    if (lgu === 'Enrique B. Magalona') q = encodeURIComponent(`E. B. Magalona, Negros Occidental, Philippines`);
    if (lgu === 'Salvador Benedicto') q = encodeURIComponent(`Don Salvador Benedicto, Negros Occidental, Philippines`);
    
    const url = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`;
    
    try {
      const data = await new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'LguProximityBot/1.0' } }, (res) => {
          let body = '';
          res.on('data', chunk => body += chunk);
          res.on('end', () => resolve(JSON.parse(body)));
        }).on('error', reject);
      });
      
      if (data && data.length > 0) {
        results.push({ name: lgu, lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
        console.log(`Found: ${lgu} -> ${data[0].lat}, ${data[0].lon}`);
      } else {
        console.log(`Not found: ${lgu}`);
      }
    } catch (e) {
      console.error(`Error fetching ${lgu}:`, e.message);
    }
    // Sleep 1.5s to respect Nominatim rate limit
    await new Promise(r => setTimeout(r, 1500));
  }
  fs.writeFileSync('osm_coords.json', JSON.stringify(results, null, 2));
}

fetchCoords();
