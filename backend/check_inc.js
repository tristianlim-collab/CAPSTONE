
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const inc = await prisma.incident.findFirst({
    where: { incident_code: 'INC-1780586990434-260' },
    include: { barangay: true }
  });
  console.log(JSON.stringify(inc, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
