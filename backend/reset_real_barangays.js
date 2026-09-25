import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetUnitBarangaysToRealBarangays() {
  console.log('Resetting unit base locations to real Barangays...');

  // Remove fake 'HQ' barangays if created earlier
  const fakeHqs = await prisma.barangay.findMany({
    where: {
      name: { in: ["Silay City HQ", "Talisay Central HQ", "Victorias City HQ", "Murcia HQ", "E.B. Magalona HQ"] }
    }
  });

  if (fakeHqs.length > 0) {
    const fakeIds = fakeHqs.map(b => b.barangay_id);
    await prisma.responseUnit.updateMany({
      where: { barangay_id: { in: fakeIds } },
      data: { barangay_id: null }
    });
    await prisma.barangay.deleteMany({
      where: { barangay_id: { in: fakeIds } }
    });
  }

  // Get real Barangays
  const barangays = await prisma.barangay.findMany();
  const units = await prisma.responseUnit.findMany();

  if (barangays.length === 0) {
    console.log('No barangays found in DB.');
    return;
  }

  for (let i = 0; i < units.length; i++) {
    const unit = units[i];
    // Assign a real barangay (e.g. Zone 1, Zone 16, Bulanon, etc.)
    const realBrgy = barangays[i % barangays.length];
    await prisma.responseUnit.update({
      where: { unit_id: unit.unit_id },
      data: {
        barangay_id: realBrgy.barangay_id
      }
    });
    console.log(`Unit: "${unit.unit_name}" -> Base Location (Barangay): "${realBrgy.name}"`);
  }

  console.log('\n--- BASE LOCATIONS UPDATED TO REAL BARANGAYS ---');
}

resetUnitBarangaysToRealBarangays()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
