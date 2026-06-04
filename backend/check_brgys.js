
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const brgys = await prisma.barangay.findMany({
    select: { barangay_id: true, name: true }
  });
  console.log(JSON.stringify(brgys, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
