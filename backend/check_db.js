import { prisma } from './src/config/database.js';

async function check() {
  // Check PostIncidentReport table structure
  const result = await prisma.$queryRaw`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'POST_INCIDENT_REPORTS' 
    ORDER BY ordinal_position
  `;
  
  console.log('POST_INCIDENT_REPORTS columns:');
  console.table(result);
  
  await prisma.$disconnect();
}

check().catch(console.error);
