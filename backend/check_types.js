import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const types = await prisma.incidentType.findMany();
  console.log('Incident Types in DB:', types.map(t => ({ id: t.type_id, name: t.name })));

  const postReports = await prisma.postIncidentReport.findMany({
    select: { response_time_minutes: true }
  });
  console.log('Post reports count:', postReports.length);
  const validTimes = postReports.map(r => r.response_time_minutes).filter(Boolean);
  console.log('Valid response times count:', validTimes.length, validTimes.slice(0, 5));

  const assignments = await prisma.incidentAssignment.findMany();
  console.log('Assignments count:', assignments.length);
}

main().finally(() => prisma.$disconnect());
