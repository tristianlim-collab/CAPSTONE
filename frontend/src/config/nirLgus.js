const normalize = (value) => (value || '').toString().trim().toLowerCase();

// ── City / Municipality center coordinates for proximity overlays ──
// Each entry: { name, lat, lng }
const NEGROS_OCCIDENTAL_CITIES = [
  // Cities
  { name: 'Bacolod', lat: 10.6840, lng: 122.9740 },
  { name: 'Bago', lat: 10.5380, lng: 122.8380 },
  { name: 'Cadiz', lat: 10.9480, lng: 123.3080 },
  { name: 'Escalante', lat: 10.8410, lng: 123.4990 },
  { name: 'Himamaylan', lat: 9.8170, lng: 122.8700 },
  { name: 'Kabankalan', lat: 9.5845, lng: 122.8170 },
  { name: 'La Carlota', lat: 10.4130, lng: 122.9210 },
  { name: 'Sagay', lat: 10.9440, lng: 123.4240 },
  { name: 'San Carlos', lat: 10.4920, lng: 123.4110 },
  { name: 'Silay', lat: 10.8110, lng: 122.9700 },
  { name: 'Sipalay', lat: 9.7500, lng: 122.4000 },
  { name: 'Talisay', lat: 10.7370, lng: 122.9670 },
  { name: 'Victorias', lat: 10.9010, lng: 123.1000 },
  // Municipalities
  { name: 'Binalbagan', lat: 10.1960, lng: 122.8630 },
  { name: 'Calatrava', lat: 10.6000, lng: 123.5000 },
  { name: 'Candoni', lat: 9.8170, lng: 122.6170 },
  { name: 'Cauayan', lat: 9.8630, lng: 122.4870 },
  { name: 'Enrique B. Magalona', lat: 10.8670, lng: 123.0830 },
  { name: 'Hinigaran', lat: 10.2750, lng: 122.8500 },
  { name: 'Hinoba-an', lat: 9.6000, lng: 122.5000 },
  { name: 'Ilog', lat: 9.7670, lng: 122.7670 },
  { name: 'Isabela', lat: 10.2040, lng: 122.9710 },
  { name: 'La Castellana', lat: 10.3320, lng: 122.9360 },
  { name: 'Manapla', lat: 10.9580, lng: 123.1210 },
  { name: 'Moises Padilla', lat: 10.2730, lng: 122.9870 },
  { name: 'Murcia', lat: 10.6040, lng: 122.9250 },
  { name: 'Pontevedra', lat: 9.8580, lng: 122.7670 },
  { name: 'Pulupandan', lat: 10.5250, lng: 122.7920 },
  { name: 'Salvador Benedicto', lat: 10.6170, lng: 123.0170 },
  { name: 'San Enrique', lat: 10.4170, lng: 122.8500 },
  { name: 'Toboso', lat: 10.6050, lng: 123.5150 },
  { name: 'Valladolid', lat: 10.4650, lng: 122.8230 },
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
 * Get the proximity level of a target city relative to an incident city.
 * - 'incident' → same city (red)
 * - 'nearby'   → nearby city within ~45km (blue)
 * - 'far'      → far city / different region (green)
 *
 * @param {string} incidentCityName - The city where the incident occurred
 * @param {string} targetCityName   - The city to evaluate
 * @returns {'incident'|'nearby'|'far'}
 */
export function getProximityLevel(incidentCityName, targetCityName) {
  const incNorm = normalize(incidentCityName);
  const tgtNorm = normalize(targetCityName);

  if (incNorm === tgtNorm) return 'incident';

  const incCity = findCityByName(incNorm);
  const tgtCity = findCityByName(tgtNorm);

  if (incCity && tgtCity) {
    const dist = distanceKm(incCity.lat, incCity.lng, tgtCity.lat, tgtCity.lng);
    // If distance is less than 45km, consider it nearby
    if (dist <= 45) {
      return 'nearby';
    }
    return 'far';
  }

  // Fallback to province matching if coords are missing for some reason
  const incProvince = PROVINCE_BY_LGU.get(incNorm);
  const tgtProvince = PROVINCE_BY_LGU.get(tgtNorm);

  if (incProvince && tgtProvince && incProvince === tgtProvince) {
    return 'nearby';
  }

  return 'far';
}
