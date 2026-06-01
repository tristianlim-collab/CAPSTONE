import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { generateIncidentCode } from "../src/utils/incidentCode.js";

const prisma = new PrismaClient();

const talisayBarangays = [
  {
    name: "Zone 1",
    municipality: "Talisay",
    city: "Negros Occidental",
    boundary_geojson: {
      type: "Polygon",
      coordinates: [[[122.9595, 10.736], [122.966, 10.736], [122.966, 10.742], [122.9595, 10.742], [122.9595, 10.736]]],
    },
  },
  {
    name: "Zone 2",
    municipality: "Talisay",
    city: "Negros Occidental",
    boundary_geojson: {
      type: "Polygon",
      coordinates: [[[122.966, 10.736], [122.972, 10.736], [122.972, 10.742], [122.966, 10.742], [122.966, 10.736]]],
    },
  },
  {
    name: "Zone 3",
    municipality: "Talisay",
    city: "Negros Occidental",
    boundary_geojson: {
      type: "Polygon",
      coordinates: [[[122.972, 10.736], [122.978, 10.736], [122.978, 10.742], [122.972, 10.742], [122.972, 10.736]]],
    },
  },
  {
    name: "Zone 4",
    municipality: "Talisay",
    city: "Negros Occidental",
    boundary_geojson: {
      type: "Polygon",
      coordinates: [[[122.9595, 10.742], [122.966, 10.742], [122.966, 10.748], [122.9595, 10.748], [122.9595, 10.742]]],
    },
  },
  {
    name: "Zone 5",
    municipality: "Talisay",
    city: "Negros Occidental",
    boundary_geojson: {
      type: "Polygon",
      coordinates: [[[122.966, 10.742], [122.972, 10.742], [122.972, 10.748], [122.966, 10.748], [122.966, 10.742]]],
    },
  },
];

const incidentTypeSeed = [
  { name: "Fire", color_code: "#F97316", icon_label: "Flame", description: "Structural or open fire incident", default_unit_type: "FIRE" },
  { name: "Medical Emergency", color_code: "#EF4444", icon_label: "Ambulance", description: "Personal medical emergencies", default_unit_type: "DRRMO" },
  { name: "Accident", color_code: "#F59E0B", icon_label: "Car", description: "Vehicular or other accidents", default_unit_type: "DRRMO" },
  { name: "Crime", color_code: "#8B5CF6", icon_label: "ShieldAlert", description: "Crime-related incident", default_unit_type: "POLICE" },
  { name: "Infrastructure Damage", color_code: "#F59E0B", icon_label: "Construction", description: "Road/bridge/public utility damage", default_unit_type: "DRRMO" },
  { name: "Public Disturbance", color_code: "#3B82F6", icon_label: "Users", description: "Public order disturbance", default_unit_type: "POLICE" },
  { name: "Other", color_code: "#64748B", icon_label: "FileText", description: "Other types of emergencies", default_unit_type: "BARANGAY" },
];

async function main() {
  await prisma.incidentAssignment.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.evidence.deleteMany();
  await prisma.incidentStatusLog.deleteMany();
  await prisma.postIncidentReport.deleteMany();
  await prisma.incident.deleteMany();
  await prisma.generatedReport.deleteMany();
  await prisma.user.deleteMany();
  await prisma.responseUnit.deleteMany();
  await prisma.incidentType.deleteMany();
  await prisma.barangay.deleteMany();

  const passwordAdmin = await bcrypt.hash("Admin@2026", 12);
  const passwordFire = await bcrypt.hash("Fire@2026", 12);
  const passwordPolice = await bcrypt.hash("Police@2026", 12);
  const passwordMedical = await bcrypt.hash("Medical@2026", 12);
  const passwordReporter = await bcrypt.hash("Reporter@2026", 12);

  const barangays = [];
  for (const barangay of talisayBarangays) {
    const created = await prisma.barangay.create({ data: barangay });
    barangays.push(created);
  }

  const incidentTypes = [];
  for (const incidentType of incidentTypeSeed) {
    const created = await prisma.incidentType.create({ data: incidentType });
    incidentTypes.push(created);
  }

  const responseUnit = await prisma.responseUnit.create({
    data: {
      unit_name: "Response Unit",
      unit_type: "BARANGAY",
      contact_number: "+639171110001",
      latitude: 10.7421,
      longitude: 122.9688,
      barangay_id: barangays[0].barangay_id,
      availability_status: "AVAILABLE",
    },
  });

  const adminUser = await prisma.user.create({
    data: {
      name: "System Admin",
      email: "admin@gaoirs.com",
      password_hash: passwordAdmin,
      role: "ADMIN",
      contact_number: "+639170001111",
      barangay_id: barangays[0].barangay_id,
    },
  });

  await prisma.user.create({
    data: {
      name: "Response Unit",
      email: "response@gaoirs.com",
      password_hash: passwordFire,
      role: "RESPONSE_UNIT",
      contact_number: "+639171110001",
      unit_id: responseUnit.unit_id,
      barangay_id: responseUnit.barangay_id,
    },
  });

  const reporter = await prisma.user.create({
    data: {
      name: "Community Reporter",
      email: "reporter@gaoirs.com",
      password_hash: passwordReporter,
      role: "REPORTER",
      contact_number: "+639179999999",
      barangay_id: barangays[3].barangay_id,
    },
  });

  // eslint-disable-next-line no-console
  console.log("Seed complete: admin, response unit, reporter, barangays, and incident types created.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });