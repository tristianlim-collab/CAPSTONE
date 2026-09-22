import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function adjustCoastPoints() {
  const coastalIncidents = await prisma.incident.findMany({
    where: { longitude: { lt: 122.966 } }
  });

  console.log(`Found ${coastalIncidents.length} incidents near coastal water edge. Moving further inland (lng >= 122.968)...`);

  let count = 0;
  for (const inc of coastalIncidents) {
    const hash = inc.incident_id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const offset = (hash % 300) / 10000; // 0.0000 to 0.0300 -> 122.968 to 122.998
    const newLongitude = 122.968 + offset;

    await prisma.incident.update({
      where: { incident_id: inc.incident_id },
      data: { longitude: newLongitude }
    });
    count++;
  }

  console.log(`Done! Moved ${count} incidents onto inland territory.`);
}

adjustCoastPoints().finally(() => prisma.$disconnect());
