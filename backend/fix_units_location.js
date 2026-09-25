import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Approximate central coordinates for each municipality/city in the 3rd District
const MUNICIPALITY_COORDINATES = {
  'talisay': { lat: 10.7421, lng: 122.9688 },
  'silay': { lat: 10.7989, lng: 122.9754 },
  'victorias': { lat: 10.8986, lng: 123.0766 },
  'murcia': { lat: 10.6027, lng: 123.0397 },
  'eb. magalona': { lat: 10.8354, lng: 122.9863 },
  'e.b. magalona': { lat: 10.8354, lng: 122.9863 },
  'eb magalona': { lat: 10.8354, lng: 122.9863 }
};

async function fixResponseUnits() {
  console.log('Fixing response units base locations & pinning base coordinates...');

  // Ensure district 3rd District exists
  const district = await prisma.district.findFirst({ where: { name: "3rd District" } });

  const LGU_BARANGAYS = [
    { name: "Silay City HQ", city: "Silay City", municipality: "Silay", lat: 10.7989, lng: 122.9754, match: "silay" },
    { name: "Talisay Central HQ", city: "Talisay City", municipality: "Talisay", lat: 10.7421, lng: 122.9688, match: "talisay" },
    { name: "Victorias City HQ", city: "Victorias City", municipality: "Victorias", lat: 10.8986, lng: 123.0766, match: "victorias" },
    { name: "Murcia HQ", city: "Murcia", municipality: "Murcia", lat: 10.6027, lng: 123.0397, match: "murcia" },
    { name: "E.B. Magalona HQ", city: "E.B. Magalona", municipality: "E.B. Magalona", lat: 10.8354, lng: 122.9863, match: "magalona" }
  ];

  const barangayMap = {};
  for (const lgu of LGU_BARANGAYS) {
    let brgy = await prisma.barangay.findFirst({ where: { name: lgu.name } });
    if (!brgy) {
      brgy = await prisma.barangay.create({
        data: {
          name: lgu.name,
          city: lgu.city,
          municipality: lgu.municipality,
          district_id: district?.district_id || null,
          congressional_district: "3rd District",
          boundary_geojson: { type: "Polygon", coordinates: [] }
        }
      });
    }
    barangayMap[lgu.match] = brgy;
  }

  const units = await prisma.responseUnit.findMany();

  for (const unit of units) {
    const nameLower = unit.unit_name.toLowerCase();
    
    let matchedLgu = LGU_BARANGAYS.find(lgu => nameLower.includes(lgu.match));
    if (!matchedLgu) {
      matchedLgu = LGU_BARANGAYS[1]; // Default to Talisay
    }

    const assignedBrgy = barangayMap[matchedLgu.match];

    await prisma.responseUnit.update({
      where: { unit_id: unit.unit_id },
      data: {
        barangay_id: assignedBrgy.barangay_id,
        latitude: matchedLgu.lat,
        longitude: matchedLgu.lng
      }
    });

    console.log(`Updated Unit: "${unit.unit_name}" -> Base Location: "${assignedBrgy.name} (${assignedBrgy.city})" | Pinned: [${matchedLgu.lat}, ${matchedLgu.lng}]`);
  }

  console.log('\n--- RESPONSE UNITS LOCATIONS ASSIGNED SUCCESSFULLY ---');
}

fixResponseUnits()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
