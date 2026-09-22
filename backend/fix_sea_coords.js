import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fixSeaCoordinates() {
  const seaIncidents = await prisma.incident.findMany({
    where: { longitude: { lt: 122.956 } }
  });

  console.log(`Found ${seaIncidents.length} incidents in the sea. Updating coordinates onto land...`);

  let updatedCount = 0;
  for (const inc of seaIncidents) {
    // Shift longitude onto land (between 122.958 and 122.985)
    // Offset slightly based on incident_id hash to maintain deterministic distribution
    const hash = inc.incident_id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const offset = (hash % 250) / 10000; // 0.0000 to 0.0250
    const newLongitude = 122.958 + offset;

    await prisma.incident.update({
      where: { incident_id: inc.incident_id },
      data: { longitude: newLongitude }
    });
    updatedCount++;
  }

  console.log(`Successfully moved ${updatedCount} incidents from the sea onto land.`);
}

fixSeaCoordinates().finally(() => prisma.$disconnect());
