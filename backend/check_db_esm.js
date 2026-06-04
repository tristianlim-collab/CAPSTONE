
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const counts = await prisma.incident.count();
    console.log('Total incidents:', counts);
    if (counts > 0) {
      const byStatus = await prisma.incident.groupBy({
        by: ['status'],
        _count: { _all: true },
      });
      console.log('By status:', JSON.stringify(byStatus, null, 2));
    }
  } catch (err) {
    console.error('Error querying DB:', err.message);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
