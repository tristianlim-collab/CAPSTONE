import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.incident.count({
    where: { longitude: { lt: 122.955 } }
  });
  console.log('Incidents in sea count:', count);

  const seaIncidents = await prisma.incident.findMany({
    where: { longitude: { lt: 122.955 } },
    select: { incident_id: true, incident_code: true, latitude: true, longitude: true, map_pin_address: true }
  });
  console.log('Sample sea incidents:', seaIncidents.slice(0, 10));

  const totalIncidents = await prisma.incident.count();
  console.log('Total incidents:', totalIncidents);
}

main().finally(() => prisma.$disconnect());
