
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const brgy = await prisma.barangay.findFirst({
    where: { name: { contains: 'Mambulac', mode: 'insensitive' } }
  });
  console.log(JSON.stringify(brgy, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
