const normalize = (value) => (value || '').toString().trim().toLowerCase();

const NEGROS_OCCIDENTAL = [
  // Cities
  'Bacolod',
  'Bago',
  'Cadiz',
  'Escalante',
  'Himamaylan',
  'Kabankalan',
  'La Carlota',
  'Sagay',
  'San Carlos',
  'Silay',
  'Sipalay',
  'Talisay',
  'Victorias',
  // Municipalities
  'Binalbagan',
  'Calatrava',
  'Candoni',
  'Cauayan',
  'Enrique B. Magalona',
  'Hinigaran',
  'Hinoba-an',
  'Ilog',
  'Isabela',
  'La Castellana',
  'Manapla',
  'Moises Padilla',
  'Murcia',
  'Pontevedra',
  'Pulupandan',
  'Salvador Benedicto',
  'San Enrique',
  'Toboso',
  'Valladolid',
];

const NEGROS_ORIENTAL = [
  // Cities
  'Bais',
  'Bayawan',
  'Canlaon',
  'Dumaguete',
  'Guihulngan',
  'Tanjay',
  // Municipalities
  'Amlan',
  'Ayungon',
  'Bacong',
  'Basay',
  'Bindoy',
  'Dauin',
  'Jimalalud',
  'La Libertad',
  'Mabinay',
  'Manjuyod',
  'Pamplona',
  'San Jose',
  'Santa Catalina',
  'Siaton',
  'Sibulan',
  'Tayasan',
  'Valencia',
  'Vallehermoso',
  'Zamboanguita',
];

const SIQUIJOR = [
  'Enrique Villanueva',
  'Larena',
  'Lazi',
  'Maria',
  'San Juan',
  'Siquijor',
];

const PROVINCE_BY_LGU = new Map(
  [
    ...NEGROS_OCCIDENTAL.map((n) => [normalize(n), 'Negros Occidental']),
    ...NEGROS_ORIENTAL.map((n) => [normalize(n), 'Negros Oriental']),
    ...SIQUIJOR.map((n) => [normalize(n), 'Siquijor']),
  ]
);

export function getProvinceForNirLguName(lguName) {
  return PROVINCE_BY_LGU.get(normalize(lguName)) || null;
}

