import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function mergeDuplicateTypes() {
  const allTypes = await prisma.incidentType.findMany();
  console.log('Original Incident Types:', allTypes.map(t => t.name));

  // Find target primary "Flood/Typhoon" or "Flood / Typhoon"
  const floodTypes = allTypes.filter(t => t.name.toLowerCase().includes('flood'));
  console.log('Found flood types:', floodTypes);

  if (floodTypes.length > 1) {
    // Standardize to "Flood/Typhoon"
    const primary = floodTypes.find(t => t.name === 'Flood/Typhoon') || floodTypes[0];
    const duplicates = floodTypes.filter(t => t.type_id !== primary.type_id);

    for (const dup of duplicates) {
      console.log(`Reassigning incidents from duplicate type "${dup.name}" (${dup.type_id}) to primary "${primary.name}" (${primary.type_id})...`);
      const updated = await prisma.incident.updateMany({
        where: { incident_type_id: dup.type_id },
        data: { incident_type_id: primary.type_id }
      });
      console.log(`Updated ${updated.count} incidents.`);

      // Delete duplicate type
      await prisma.incidentType.delete({ where: { type_id: dup.type_id } }).catch(err => {
        console.warn('Could not delete duplicate type:', err.message);
      });
    }
  }

  console.log('Cleanup complete!');
}

mergeDuplicateTypes().finally(() => prisma.$disconnect());
