const normalize = (value) => (value || '').toString().trim().toLowerCase();

// ── City / Municipality center coordinates for proximity overlays ──
// Each entry: { name, lat, lng }
const NEGROS_OCCIDENTAL_CITIES = [
  // Cities
  { name: 'Bacolod', lat: 10.6765, lng: 122.9509 },
  { name: 'Bago', lat: 10.5376, lng: 122.8353 },
  { name: 'Cadiz', lat: 10.9567, lng: 123.3057 },
  { name: 'Escalante', lat: 10.8413, lng: 123.4993 },
  { name: 'Himamaylan', lat: 10.0993, lng: 122.8705 },
  { name: 'Kabankalan', lat: 9.9889, lng: 122.8135 },
  { name: 'La Carlota', lat: 10.4269, lng: 122.9208 },
  { name: 'Sagay', lat: 10.8961, lng: 123.4155 },
  { name: 'San Carlos', lat: 10.4860, lng: 123.4190 },
  { name: 'Silay', lat: 10.7994, lng: 122.9753 },
  { name: 'Sipalay', lat: 9.7491, lng: 122.4041 },
  { name: 'Talisay', lat: 10.7370, lng: 122.9670 },
  { name: 'Victorias', lat: 10.9013, lng: 123.0715 },
  // Municipalities
  { name: 'Binalbagan', lat: 10.1937, lng: 122.8588 },
  { name: 'Calatrava', lat: 10.5940, lng: 123.4764 },
  { name: 'Candoni', lat: 9.8307, lng: 122.6430 },
  { name: 'Cauayan', lat: 9.9734, lng: 122.6260 },
  { name: 'Enrique B. Magalona', lat: 10.8771, lng: 122.9814 },
  { name: 'Hinigaran', lat: 10.2714, lng: 122.8520 },
  { name: 'Hinoba-an', lat: 9.6022, lng: 122.4671 },
  { name: 'Ilog', lat: 10.0242, lng: 122.7692 },
  { name: 'Isabela', lat: 10.2048, lng: 122.9893 },
  { name: 'La Castellana', lat: 10.3230, lng: 123.0187 },
  { name: 'Manapla', lat: 10.9591, lng: 123.1235 },
  { name: 'Moises Padilla', lat: 10.2708, lng: 123.0734 },
  { name: 'Murcia', lat: 10.6066, lng: 123.0405 },
  { name: 'Pontevedra', lat: 10.3751, lng: 122.8668 },
  { name: 'Pulupandan', lat: 10.5192, lng: 122.8035 },
  { name: 'Salvador Benedicto', lat: 10.5771, lng: 123.2204 },
  { name: 'San Enrique', lat: 10.4197, lng: 122.8495 },
  { name: 'Toboso', lat: 10.7169, lng: 123.5136 },
  { name: 'Valladolid', lat: 10.4615, lng: 122.8234 },
];

const NEGROS_ORIENTAL_CITIES = [
  // Cities
  { name: 'Bais', lat: 9.5910, lng: 123.1200 },
  { name: 'Bayawan', lat: 9.3670, lng: 122.8000 },
  { name: 'Canlaon', lat: 10.3840, lng: 123.2110 },
  { name: 'Dumaguete', lat: 9.3070, lng: 123.3070 },
  { name: 'Guihulngan', lat: 10.1170, lng: 123.2750 },
  { name: 'Tanjay', lat: 9.5170, lng: 123.1580 },
  // Municipalities
  { name: 'Amlan', lat: 9.3500, lng: 123.2330 },
  { name: 'Ayungon', lat: 9.8500, lng: 123.1500 },
  { name: 'Bacong', lat: 9.2500, lng: 123.3000 },
  { name: 'Basay', lat: 9.4500, lng: 122.9500 },
  { name: 'Bindoy', lat: 9.7500, lng: 123.1670 },
  { name: 'Dauin', lat: 9.2000, lng: 123.2670 },
  { name: 'Jimalalud', lat: 9.9670, lng: 123.2330 },
  { name: 'La Libertad', lat: 9.9670, lng: 123.2170 },
  { name: 'Mabinay', lat: 9.7330, lng: 122.9830 },
  { name: 'Manjuyod', lat: 9.6830, lng: 123.1500 },
  { name: 'Pamplona', lat: 9.4670, lng: 122.8830 },
  { name: 'San Jose', lat: 9.4330, lng: 123.0500 },
  { name: 'Santa Catalina', lat: 9.3670, lng: 122.8600 },
  { name: 'Siaton', lat: 9.0670, lng: 123.0330 },
  { name: 'Sibulan', lat: 9.3500, lng: 123.2830 },
  { name: 'Tayasan', lat: 9.9170, lng: 123.1500 },
  { name: 'Valencia', lat: 9.2830, lng: 123.2330 },
  { name: 'Vallehermoso', lat: 10.3000, lng: 123.3170 },
  { name: 'Zamboanguita', lat: 9.1000, lng: 123.2000 },
];

const SIQUIJOR_CITIES = [
  { name: 'Enrique Villanueva', lat: 9.2170, lng: 123.5670 },
  { name: 'Larena', lat: 9.2500, lng: 123.5830 },
  { name: 'Lazi', lat: 9.2000, lng: 123.6330 },
  { name: 'Maria', lat: 9.1830, lng: 123.5330 },
  { name: 'San Juan', lat: 9.1670, lng: 123.5000 },
  { name: 'Siquijor', lat: 9.2140, lng: 123.5100 },
];

// Backward-compatible arrays (just names)
const NEGROS_OCCIDENTAL = NEGROS_OCCIDENTAL_CITIES.map(c => c.name);
const NEGROS_ORIENTAL = NEGROS_ORIENTAL_CITIES.map(c => c.name);
const SIQUIJOR = SIQUIJOR_CITIES.map(c => c.name);

// Province lookup map
const PROVINCE_BY_LGU = new Map(
  [
    ...NEGROS_OCCIDENTAL.map((n) => [normalize(n), 'Negros Occidental']),
    ...NEGROS_ORIENTAL.map((n) => [normalize(n), 'Negros Oriental']),
    ...SIQUIJOR.map((n) => [normalize(n), 'Siquijor']),
  ]
);

// Full city data with province tagged
const ALL_CITIES = [
  ...NEGROS_OCCIDENTAL_CITIES.map(c => ({ ...c, province: 'Negros Occidental' })),
  ...NEGROS_ORIENTAL_CITIES.map(c => ({ ...c, province: 'Negros Oriental' })),
  ...SIQUIJOR_CITIES.map(c => ({ ...c, province: 'Siquijor' })),
];

/**
 * Get province for a given city/municipality name
 */
export function getProvinceForNirLguName(lguName) {
  return PROVINCE_BY_LGU.get(normalize(lguName)) || null;
}

/**
 * Get all cities with their coordinates and province
 * @returns {{ name: string, lat: number, lng: number, province: string }[]}
 */
export function getAllNirCities() {
  return ALL_CITIES;
}

/**
 * Find city data by name (case-insensitive)
 */
export function findCityByName(cityName) {
  const n = normalize(cityName);
  return ALL_CITIES.find(c => normalize(c.name) === n) || null;
}

/**
 * Haversine distance in km between two lat/lng points
 */
export function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Find the nearest city to a given coordinate
 */
export function getNearestCity(lat, lng) {
  if (!lat || !lng) return null;
  let nearest = null;
  let minDistance = Infinity;

  for (const city of ALL_CITIES) {
    const d = distanceKm(lat, lng, city.lat, city.lng);
    if (d < minDistance) {
      minDistance = d;
      nearest = city;
    }
  }
  return nearest;
}


/**
 * Adjacency map strictly following the North-South highway sequence.
 * Inland connections are removed so only the exact 'next city' north or south becomes blue.
 */
const LGU_ADJACENCY = {
  // Coastal North to South Sequence
  'san carlos': ['calatrava', 'salvador benedicto'],
  'calatrava': ['san carlos', 'toboso'],
  'toboso': ['calatrava', 'escalante'],
  'escalante': ['toboso', 'sagay'],
  'sagay': ['escalante', 'cadiz'],
  'cadiz': ['sagay', 'manapla'],
  'manapla': ['cadiz', 'victorias'],
  'victorias': ['manapla', 'enrique b. magalona'],
  'enrique b. magalona': ['victorias', 'silay'],
  'silay': ['enrique b. magalona', 'talisay'],
  'talisay': ['silay', 'bacolod'],
  'bacolod': ['talisay', 'bago'],
  'bago': ['bacolod', 'pulupandan', 'valladolid'],
  'pulupandan': ['bago', 'valladolid'],
  'valladolid': ['pulupandan', 'bago', 'san enrique'],
  'san enrique': ['valladolid', 'pontevedra'],
  'pontevedra': ['san enrique', 'hinigaran'],
  'hinigaran': ['pontevedra', 'binalbagan'],
  'binalbagan': ['hinigaran', 'himamaylan'],
  'himamaylan': ['binalbagan', 'kabankalan'],
  'kabankalan': ['himamaylan', 'ilog'],
  'ilog': ['kabankalan', 'cauayan'],
  'cauayan': ['ilog', 'sipalay'],
  'sipalay': ['cauayan', 'hinoba-an'],
  'hinoba-an': ['sipalay'],

  // Inland Cities (Strictly neighbor to their access points)
  'murcia': ['bacolod', 'salvador benedicto'],
  'salvador benedicto': ['murcia', 'san carlos'],
  'la carlota': ['bago', 'la castellana'],
  'la castellana': ['la carlota', 'isabela', 'moises padilla'],
  'isabela': ['la castellana', 'binalbagan', 'moises padilla'],
  'moises padilla': ['la castellana', 'isabela'],
  'candoni': ['cauayan', 'sipalay']
};

/**
 * Get the proximity level of a target city relative to an incident city.
 * - 'incident' → same city (no marker)
 * - 'nearby'   → immediate border neighbor (blue)
 * - 'far'      → neighbors of neighbors (green)
 * - 'none'     → do not show marker
 *
 * @param {string} incidentCityName - The city where the incident occurred
 * @param {string} targetCityName   - The city to evaluate
 * @returns {'incident'|'nearby'|'far'|'none'}
 */
export function getProximityLevel(incidentCityName, targetCityName) {
  const incNorm = normalize(incidentCityName);
  const tgtNorm = normalize(targetCityName);

  if (incNorm === tgtNorm) return 'incident';

  // 1. Check direct neighbors (blue)
  const neighbors = LGU_ADJACENCY[incNorm] || [];
  if (neighbors.includes(tgtNorm)) {
    return 'nearby';
  }

  // 2. Check secondary neighbors (green) - neighbors of neighbors
  let secondaryNeighbors = [];
  for (const n of neighbors) {
    const nextNeighbors = LGU_ADJACENCY[n] || [];
    secondaryNeighbors.push(...nextNeighbors);
  }
  
  // Remove duplicates, the incident city itself, and any immediate neighbors
  secondaryNeighbors = [...new Set(secondaryNeighbors)].filter(c => c !== incNorm && !neighbors.includes(c));
  
  if (secondaryNeighbors.includes(tgtNorm)) {
    return 'far';
  }

  // 3. Fallback to strict distance if not in adjacency list (e.g. Oriental/Siquijor)
  // Only if no adjacency list exists for the incident city
  if (neighbors.length === 0) {
    const incCity = findCityByName(incNorm);
    const tgtCity = findCityByName(tgtNorm);

    if (incCity && tgtCity) {
      const dist = distanceKm(incCity.lat, incCity.lng, tgtCity.lat, tgtCity.lng);
      // 25km strict threshold for immediate neighbors
      if (dist <= 25) return 'nearby';
      // 25-50km for secondary neighbors
      if (dist > 25 && dist <= 50) return 'far';
    }
  }

  return 'none';
}
