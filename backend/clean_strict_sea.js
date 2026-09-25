import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanStrictSeaIncidents() {
  console.log('Finding remaining coastal & sea incidents...');

  const allIncidents = await prisma.incident.findMany({
    select: {
      incident_id: true,
      incident_code: true,
      latitude: true,
      longitude: true
    }
  });

  // Strict coastal cutoff for Talisay / Bacolod land boundary:
  // Coastline curves between 122.952 and 122.960.
  // Any point with longitude < 122.955 OR (latitude > 10.74 AND longitude < 122.960) is off the coastline in the water.
  const seaIncidents = allIncidents.filter(inc => {
    if (inc.longitude < 122.955) return true;
    if (inc.latitude > 10.74 && inc.longitude < 122.960) return true;
    return false;
  });

  console.log(`Total incidents in database: ${allIncidents.length}`);
  console.log(`Found ${seaIncidents.length} remaining coastal/sea incidents.`);

  const seaIds = seaIncidents.map(inc => inc.incident_id);

  if (seaIds.length > 0) {
    await prisma.incidentAssignment.deleteMany({ where: { incident_id: { in: seaIds } } });
    await prisma.notification.deleteMany({ where: { incident_id: { in: seaIds } } });
    await prisma.evidence.deleteMany({ where: { incident_id: { in: seaIds } } });
    await prisma.incidentStatusLog.deleteMany({ where: { incident_id: { in: seaIds } } });
    await prisma.postIncidentReport.deleteMany({ where: { incident_id: { in: seaIds } } });

    const deleted = await prisma.incident.deleteMany({
      where: { incident_id: { in: seaIds } }
    });

    console.log(`Successfully deleted ${deleted.count} coastal/sea incidents.`);
  }

  const remaining = await prisma.incident.count();
  console.log(`Remaining land incidents: ${remaining}`);
}

cleanStrictSeaIncidents()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
