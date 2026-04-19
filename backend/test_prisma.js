import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  try {
     const inc = await prisma.incident.findMany({
       where: {
         assignments: { some: { unit: { users: { some: { user_id: 'NON_EXISTENT' } } } } }
       }
     });
     console.log('SUCCESS:', inc.length);
  } catch(e) {
     console.log('ERROR IS EXACTLY THIS:', e.message);
  } finally {
     await prisma.$disconnect();
  }
}
run();
