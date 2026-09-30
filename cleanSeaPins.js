import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanSeaCoordinates() {
  // Remove incident map pins falling into the ocean/sea (Longitude < 122.932 or Latitude outside land bound)
  const deletedIncidents = await prisma.incident.deleteMany({
    where: {
      OR: [
        { longitude: { lt: 122.932 } },
        { latitude: { lt: 10.680 } }
      ]
    }
  });

  // Relocate any Response Units currently positioned out in the ocean to central land (Talisay City DRRMO HQ)
  const updatedUnits = await prisma.responseUnit.updateMany({
    where: {
      OR: [
        { longitude: { lt: 122.932 } },
        { latitude: { lt: 10.680 } }
      ]
    },
    data: {
      latitude: 10.7350,
      longitude: 122.9700
    }
  });

  console.log(`✅ Cleaned up sea map pins!`);
  console.log(`- Deleted ${deletedIncidents.count} incidents plotted in the sea.`);
  console.log(`- Relocated ${updatedUnits.count} response units back to land.`);
}

cleanSeaCoordinates()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
