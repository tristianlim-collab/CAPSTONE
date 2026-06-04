
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const units = await prisma.responseUnit.findMany({
    select: { unit_name: true, barangay_id: true }
  });
  console.log(JSON.stringify(units, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
