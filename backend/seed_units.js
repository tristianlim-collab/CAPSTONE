import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seed() {
  console.log('Seeding fake response units...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  const units = [
    {
      name: 'Kabankalan City Hospital EMS',
      type: 'MEDICAL',
      lat: 9.995000,
      lng: 122.815000,
      email: 'medic@gaoirs.com',
      contact: '09171112222'
    },
    {
      name: 'Kabankalan Fire Rescue',
      type: 'FIRE',
      lat: 9.990000,
      lng: 122.810000,
      email: 'fire@gaoirs.com',
      contact: '09173334444'
    },
    {
      name: 'Kabankalan Police HQ',
      type: 'POLICE',
      lat: 9.985000,
      lng: 122.820000,
      email: 'police@gaoirs.com',
      contact: '09175556666'
    }
  ];

  for (const u of units) {
    // Check if email exists
    const exists = await prisma.user.findUnique({ where: { email: u.email } });
    if (exists) {
      console.log(`User ${u.email} already exists, skipping...`);
      // Update their coordinates just in case to make sure they are available!
      if (exists.unit_id) {
        await prisma.responseUnit.update({
          where: { unit_id: exists.unit_id },
          data: { latitude: u.lat, longitude: u.lng, availability_status: 'AVAILABLE' }
        });
      }
      continue;
    }

    // Create unit
    const unit = await prisma.responseUnit.create({
      data: {
        unit_name: u.name,
        unit_type: u.type,
        latitude: u.lat,
        longitude: u.lng,
        availability_status: 'AVAILABLE',
        contact_number: u.contact
      }
    });

    // Create user attached to unit
    await prisma.user.create({
      data: {
        name: `Officer ${u.type}`,
        email: u.email,
        password_hash: hashedPassword,
        role: 'RESPONSE_UNIT',
        contact_number: u.contact,
        unit_id: unit.unit_id
      }
    });

    console.log(`Created ${u.name} and account ${u.email}`);
  }

  console.log('Seeding complete!');
  await prisma.$disconnect();
}

seed().catch(e => {
  console.error(e);
  prisma.$disconnect();
});
