import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanSeaIncidents() {
  console.log('Finding incidents located in the sea...');

  // Get all incidents
  const allIncidents = await prisma.incident.findMany({
    select: {
      incident_id: true,
      incident_code: true,
      latitude: true,
      longitude: true,
      map_pin_address: true,
      barangay: {
        select: {
          name: true
        }
      }
    }
  });

  // Sea boundary definition based on map inspection:
  // Coastline along Talisay / Bacolod runs roughly along longitude 122.945 to 122.955
  // Any point with longitude < 122.945 is in the Guimaras Strait (sea)
  const seaIncidents = allIncidents.filter(inc => inc.longitude < 122.945);

  console.log(`Total incidents in database: ${allIncidents.length}`);
  console.log(`Found ${seaIncidents.length} incidents in the sea (longitude < 122.945).`);

  const seaIds = seaIncidents.map(inc => inc.incident_id);

  if (seaIds.length > 0) {
    // Delete dependent relations first
    await prisma.incidentAssignment.deleteMany({ where: { incident_id: { in: seaIds } } });
    await prisma.notification.deleteMany({ where: { incident_id: { in: seaIds } } });
    await prisma.evidence.deleteMany({ where: { incident_id: { in: seaIds } } });
    await prisma.incidentStatusLog.deleteMany({ where: { incident_id: { in: seaIds } } });
    await prisma.postIncidentReport.deleteMany({ where: { incident_id: { in: seaIds } } });

    // Delete incidents in sea
    const deleted = await prisma.incident.deleteMany({
      where: {
        incident_id: { in: seaIds }
      }
    });

    console.log(`Successfully deleted ${deleted.count} sea incidents from database.`);
  } else {
    console.log('No sea incidents found to delete.');
  }

  const remaining = await prisma.incident.count();
  console.log(`Remaining land incidents: ${remaining}`);
}

cleanSeaIncidents()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
