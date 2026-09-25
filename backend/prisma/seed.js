import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { generateIncidentCode } from "../src/utils/incidentCode.js";

const prisma = new PrismaClient();

const talisayBarangays = [
  {
    name: "Zone 1",
    municipality: "Talisay",
    city: "Negros Occidental",
    congressional_district: "3rd District of Negros Occidental",
    boundary_geojson: {
      type: "Polygon",
      coordinates: [[[122.9595, 10.736], [122.966, 10.736], [122.966, 10.742], [122.9595, 10.742], [122.9595, 10.736]]],
    },
  },
  {
    name: "Zone 2",
    municipality: "Talisay",
    city: "Negros Occidental",
    congressional_district: "3rd District of Negros Occidental",
    boundary_geojson: {
      type: "Polygon",
      coordinates: [[[122.966, 10.736], [122.972, 10.736], [122.972, 10.742], [122.966, 10.742], [122.966, 10.736]]],
    },
  },
  {
    name: "Zone 3",
    municipality: "Talisay",
    city: "Negros Occidental",
    congressional_district: "3rd District of Negros Occidental",
    boundary_geojson: {
      type: "Polygon",
      coordinates: [[[122.972, 10.736], [122.978, 10.736], [122.978, 10.742], [122.972, 10.742], [122.972, 10.736]]],
    },
  },
  {
    name: "Zone 4",
    municipality: "Talisay",
    city: "Negros Occidental",
    congressional_district: "3rd District of Negros Occidental",
    boundary_geojson: {
      type: "Polygon",
      coordinates: [[[122.9595, 10.742], [122.966, 10.742], [122.966, 10.748], [122.9595, 10.748], [122.9595, 10.742]]],
    },
  },
  {
    name: "Zone 5",
    municipality: "Talisay",
    city: "Negros Occidental",
    congressional_district: "3rd District of Negros Occidental",
    boundary_geojson: {
      type: "Polygon",
      coordinates: [[[122.966, 10.742], [122.972, 10.742], [122.972, 10.748], [122.966, 10.748], [122.966, 10.742]]],
    },
  },
];

const incidentTypeSeed = [
  { name: "Fire Incident", color_code: "#F97316", icon_label: "Flame", description: "Structural, chemical, or grass fire emergency", default_unit_type: "FIRE" },
  { name: "Flood / Typhoon", color_code: "#3B82F6", icon_label: "Droplets", description: "Severe flooding, storm surge, or typhoon disaster", default_unit_type: "DRRMO" },
  { name: "Landslide", color_code: "#7C3AED", icon_label: "Mountain", description: "Landslide or soil erosion hazard", default_unit_type: "DRRMO" },
  { name: "Medical Emergency", color_code: "#EF4444", icon_label: "Ambulance", description: "Emergency medical response and trauma injuries", default_unit_type: "DRRMO" },
  { name: "Vehicular Accident", color_code: "#F59E0B", icon_label: "Car", description: "Road crash or transportation accident", default_unit_type: "DRRMO" },
  { name: "Infrastructure Damage", color_code: "#64748B", icon_label: "Construction", description: "Bridge, road, power line, or utility failure", default_unit_type: "DRRMO" },
  { name: "Other Emergency", color_code: "#475569", icon_label: "FileText", description: "Other disaster and emergency response", default_unit_type: "BARANGAY" },
];

async function main() {
  await prisma.incidentAssignment.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.evidence.deleteMany();
  await prisma.incidentStatusLog.deleteMany();
  await prisma.postIncidentReport.deleteMany();
  await prisma.incident.deleteMany();
  await prisma.generatedReport.deleteMany();
  await prisma.systemAuditLog.deleteMany();
  await prisma.user.deleteMany();
  await prisma.responseUnit.deleteMany();
  await prisma.incidentType.deleteMany();
  await prisma.barangay.deleteMany();

  const passwordAdmin = await bcrypt.hash("Admin@2026", 12);
  const passwordFire = await bcrypt.hash("Fire@2026", 12);
  const passwordPolice = await bcrypt.hash("Police@2026", 12);
  const passwordMedical = await bcrypt.hash("Medical@2026", 12);
  const passwordReporter = await bcrypt.hash("Reporter@2026", 12);

  const districtsSeed = [
    { name: "1st District", province: "Negros Occidental" },
    { name: "2nd District", province: "Negros Occidental" },
    { name: "3rd District", province: "Negros Occidental" },
    { name: "4th District", province: "Negros Occidental" },
    { name: "5th District", province: "Negros Occidental" },
    { name: "6th District", province: "Negros Occidental" }
  ];

  const createdDistricts = {};
  for (const d of districtsSeed) {
    const created = await prisma.district.upsert({
      where: { name: d.name },
      update: { province: d.province },
      create: d
    });
    createdDistricts[d.name] = created;
  }

  const defaultDistrict = createdDistricts["3rd District"];

  const barangays = [];
  for (const barangay of talisayBarangays) {
    const created = await prisma.barangay.create({
      data: {
        ...barangay,
        district_id: defaultDistrict?.district_id || null
      }
    });
    barangays.push(created);
  }

  const incidentTypes = [];
  for (const incidentType of incidentTypeSeed) {
    const created = await prisma.incidentType.create({ data: incidentType });
    incidentTypes.push(created);
  }

  // Response Units
  const fireUnit = await prisma.responseUnit.create({
    data: {
      unit_name: "BFP Station 1 - Talisay",
      unit_type: "FIRE",
      contact_number: "+639171110001",
      latitude: 10.7421,
      longitude: 122.9688,
      barangay_id: barangays[0].barangay_id,
      availability_status: "AVAILABLE",
    },
  });

  const drrmoUnit = await prisma.responseUnit.create({
    data: {
      unit_name: "Talisay City DRRMO Rescue 1",
      unit_type: "DRRMO",
      contact_number: "+639171110002",
      latitude: 10.7360,
      longitude: 122.9595,
      barangay_id: barangays[1].barangay_id,
      availability_status: "AVAILABLE",
    },
  });

  const policeUnit = await prisma.responseUnit.create({
    data: {
      unit_name: "PNP Station - Talisay",
      unit_type: "POLICE",
      contact_number: "+639171110003",
      latitude: 10.7380,
      longitude: 122.9660,
      barangay_id: barangays[2].barangay_id,
      availability_status: "AVAILABLE",
    },
  });

  // Users
  const adminUser = await prisma.user.create({
    data: {
      name: "System Admin",
      email: "admin@gaoirs.com",
      password_hash: passwordAdmin,
      role: "ADMIN",
      contact_number: "+639170001111",
      barangay_id: barangays[0].barangay_id,
      district_id: defaultDistrict?.district_id || null,
      congressional_district: "3rd District of Negros Occidental"
    },
  });

  await prisma.user.create({
    data: {
      name: "BFP Fire Responder",
      email: "fire@gaoirs.com",
      password_hash: passwordFire,
      role: "RESPONSE_UNIT",
      contact_number: "+639171110001",
      unit_id: fireUnit.unit_id,
      barangay_id: fireUnit.barangay_id,
      district_id: defaultDistrict?.district_id || null,
      congressional_district: "3rd District of Negros Occidental"
    },
  });

  await prisma.user.create({
    data: {
      name: "DRRMO Rescue Responder",
      email: "drrmo@gaoirs.com",
      password_hash: passwordFire,
      role: "RESPONSE_UNIT",
      contact_number: "+639171110002",
      unit_id: drrmoUnit.unit_id,
      barangay_id: drrmoUnit.barangay_id,
      district_id: defaultDistrict?.district_id || null,
      congressional_district: "3rd District of Negros Occidental"
    },
  });

  await prisma.user.create({
    data: {
      name: "Police Responder",
      email: "police@gaoirs.com",
      password_hash: passwordPolice,
      role: "RESPONSE_UNIT",
      contact_number: "+639171110003",
      unit_id: policeUnit.unit_id,
      barangay_id: policeUnit.barangay_id,
      district_id: defaultDistrict?.district_id || null,
      congressional_district: "3rd District of Negros Occidental"
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
      district_id: defaultDistrict?.district_id || null
    },
  });

  // Sample Incidents populated with city & district_id across different statuses
  await prisma.incident.createMany({
    data: [
      {
        incident_code: "DRRMO-20260828-0028",
        reported_by: reporter.user_id,
        incident_type_id: incidentTypes[5]?.type_id || incidentTypes[0].type_id,
        barangay_id: barangays[0].barangay_id,
        city: "Talisay City",
        district_id: defaultDistrict?.district_id || null,
        description: "Infrastructure Damage: Building crack/structural risk",
        landmark: "San Isidro DRRMO Station",
        latitude: 10.736,
        longitude: 122.9595,
        map_pin_address: "San Isidro, Talisay City, Negros Occidental",
        status: "CLOSED",
        severity: "LOW",
        reporter_name: "Local Resident",
        reporter_phone: "+639170002222"
      },
      {
        incident_code: "BFP-20260825-6144",
        reported_by: reporter.user_id,
        incident_type_id: incidentTypes[0].type_id,
        barangay_id: barangays[1].barangay_id,
        city: "Talisay City",
        district_id: defaultDistrict?.district_id || null,
        description: "Fire Incident: Candle / lighted lamp",
        landmark: "Zone 16, Bubog",
        latitude: 10.738,
        longitude: 122.966,
        map_pin_address: "Zone 16, Bubog, Talisay City, Negros Occidental",
        status: "CLOSED",
        severity: "HIGH",
        reporter_name: "Local Resident",
        reporter_phone: "+639170003333"
      },
      {
        incident_code: "DRRMO-20260824-8038",
        reported_by: reporter.user_id,
        incident_type_id: incidentTypes[6]?.type_id || incidentTypes[0].type_id,
        barangay_id: barangays[2].barangay_id,
        city: "Talisay City",
        district_id: defaultDistrict?.district_id || null,
        description: "Other Emergency: Search and rescue assistance required",
        landmark: "Zone 3 Public Market",
        latitude: 10.740,
        longitude: 122.972,
        map_pin_address: "Zone 3, Talisay City, Negros Occidental",
        status: "RESOLVED",
        severity: "LOW",
        reporter_name: "Local Resident",
        reporter_phone: "+639170004444"
      },
      {
        incident_code: "INC-2026-001",
        reported_by: reporter.user_id,
        incident_type_id: incidentTypes[0].type_id,
        barangay_id: barangays[3].barangay_id,
        city: "Silay City",
        district_id: defaultDistrict?.district_id || null,
        description: "Residential fire reported in Zone 4.",
        landmark: "Near Barangay Hall",
        latitude: 10.7989,
        longitude: 122.9754,
        map_pin_address: "Zone 4, Silay City, Negros Occidental",
        status: "REPORTED",
        severity: "HIGH",
        reporter_name: "Community Reporter",
        reporter_phone: "+639179999999"
      },
      {
        incident_code: "INC-2026-002",
        reported_by: reporter.user_id,
        incident_type_id: incidentTypes[3]?.type_id || incidentTypes[0].type_id,
        barangay_id: barangays[4].barangay_id,
        city: "Talisay City",
        district_id: defaultDistrict?.district_id || null,
        description: "Vehicular accident requiring medical assistance.",
        landmark: "Highway intersection",
        latitude: 10.7301,
        longitude: 122.9691,
        map_pin_address: "Zone 5, Talisay City, Negros Occidental",
        status: "RESPONDING",
        severity: "CRITICAL",
        reporter_name: "Community Reporter",
        reporter_phone: "+639179999999"
      }
    ]
  });

  // eslint-disable-next-line no-console
  console.log("Seed complete: admin, response unit, reporter, barangays, districts, and sample incidents created.");
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