import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function unpinAllUnits() {
  console.log('Clearing all auto-pins and resetting base locations to Unassigned...');

  await prisma.responseUnit.updateMany({
    data: {
      latitude: null,
      longitude: null,
      barangay_id: null
    }
  });

  console.log('All units reset: Pinned = No Pin | Base Location = Unassigned');
}

unpinAllUnits()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
