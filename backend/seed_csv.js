import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const prisma = new PrismaClient();

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
  const headers = parseCSVLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === headers.length) {
      const row = {};
      headers.forEach((h, idx) => {
        row[h.trim()] = values[idx].trim();
      });
      rows.push(row);
    }
  }
  return rows;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

// Bounding box filter for land in Talisay City & 3rd District (longitude >= 122.945)
function isLandCoordinate(lat, lng) {
  if (lng < 122.945) return false; // Sea filter (Guimaras Strait)
  if (lat < 10.65 || lat > 10.85) return false;
  return true;
}

async function main() {
  console.log('Importing incident reports from CSV...');

  const csvPath = 'C:\\Users\\Tristan Zane\\OneDrive\\Desktop\\CAPSTONE\\Talisay_City_DRRMO_BFP_Incident_Reports-1.csv';
  const csvText = fs.readFileSync(csvPath, 'utf8');
  const csvRecords = parseCSV(csvText);

  console.log(`Loaded ${csvRecords.length} records from CSV.`);

  // 1. District
  const districtSeed = { name: "3rd District", province: "Negros Occidental" };
  const district = await prisma.district.upsert({
    where: { name: districtSeed.name },
    update: { province: districtSeed.province },
    create: districtSeed
  });

  // 2. Incident Types
  const incidentTypesMap = {};
  const incidentTypeSeeds = [
    { name: "Fire Incident", color_code: "#F97316", icon_label: "Flame", description: "Structural, chemical, or grass fire emergency", default_unit_type: "FIRE" },
    { name: "Flood/Typhoon", color_code: "#3B82F6", icon_label: "Droplets", description: "Severe flooding, storm surge, or typhoon disaster", default_unit_type: "DRRMO" },
    { name: "Landslide", color_code: "#7C3AED", icon_label: "Mountain", description: "Landslide or soil erosion hazard", default_unit_type: "DRRMO" },
    { name: "Medical Emergency", color_code: "#EF4444", icon_label: "Ambulance", description: "Emergency medical response and trauma injuries", default_unit_type: "DRRMO" },
    { name: "Vehicular Accident", color_code: "#F59E0B", icon_label: "Car", description: "Road crash or transportation accident", default_unit_type: "DRRMO" },
    { name: "Infrastructure Damage", color_code: "#64748B", icon_label: "Construction", description: "Bridge, road, power line, or utility failure", default_unit_type: "DRRMO" },
    { name: "Other Emergency", color_code: "#475569", icon_label: "FileText", description: "Other disaster and emergency response", default_unit_type: "BARANGAY" },
    { name: "Chemical Leak", color_code: "#10B981", icon_label: "AlertTriangle", description: "Hazardous chemical or gas leak", default_unit_type: "DRRMO" }
  ];

  for (const tSeed of incidentTypeSeeds) {
    const existing = await prisma.incidentType.findFirst({ where: { name: tSeed.name } });
    if (existing) {
      incidentTypesMap[tSeed.name] = existing.type_id;
    } else {
      const created = await prisma.incidentType.create({ data: tSeed });
      incidentTypesMap[tSeed.name] = created.type_id;
    }
  }

  // 3. Barangays
  const uniqueBarangays = [...new Set(csvRecords.map(r => r.Barangay).filter(Boolean))];
  const barangaysMap = {};

  for (const bName of uniqueBarangays) {
    let existing = await prisma.barangay.findFirst({ where: { name: bName } });
    if (!existing) {
      existing = await prisma.barangay.create({
        data: {
          name: bName,
          municipality: "Talisay",
          city: "Talisay City",
          district_id: district.district_id,
          congressional_district: "3rd District of Negros Occidental",
          boundary_geojson: { type: "Polygon", coordinates: [] }
        }
      });
    }
    barangaysMap[bName] = existing.barangay_id;
  }

  // 4. Users
  const passwordAdmin = await bcrypt.hash("Admin@2026", 12);
  const passwordReporter = await bcrypt.hash("Reporter@2026", 12);
  const firstBarangayId = Object.values(barangaysMap)[0] || null;

  let reporterUser = await prisma.user.findFirst({ where: { email: "reporter@gaoirs.com" } });
  if (!reporterUser) {
    reporterUser = await prisma.user.create({
      data: {
        name: "Community Reporter",
        email: "reporter@gaoirs.com",
        password_hash: passwordReporter,
        role: "REPORTER",
        contact_number: "+639179999999",
        barangay_id: firstBarangayId,
        district_id: district.district_id
      }
    });
  }

  let adminUser = await prisma.user.findFirst({ where: { email: "admin@gaoirs.com" } });
  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        name: "System Admin",
        email: "admin@gaoirs.com",
        password_hash: passwordAdmin,
        role: "ADMIN",
        contact_number: "+639170001111",
        barangay_id: firstBarangayId,
        district_id: district.district_id,
        congressional_district: "3rd District of Negros Occidental"
      }
    });
  }

  // 5. Filter out sea incidents and insert all land incidents
  let insertedCount = 0;
  let seaFilteredCount = 0;

  for (const r of csvRecords) {
    const lat = parseFloat(r.Latitude);
    const lng = parseFloat(r.Longitude);

    if (!isLandCoordinate(lat, lng)) {
      seaFilteredCount++;
      continue;
    }

    let statusEnum = 'REPORTED';
    const csvStatus = (r.Status || '').toUpperCase();
    if (csvStatus === 'CLOSED') statusEnum = 'CLOSED';
    else if (csvStatus === 'RESOLVED') statusEnum = 'RESOLVED';
    else if (csvStatus === 'ONGOING' || csvStatus === 'RESPONDING') statusEnum = 'RESPONDING';
    else if (csvStatus === 'FALSE ALARM') statusEnum = 'FALSE_ALARM';
    else if (csvStatus === 'VERIFIED') statusEnum = 'VERIFIED';

    let severityEnum = 'MEDIUM';
    const csvSeverity = (r.Severity || '').toUpperCase();
    if (csvSeverity === 'HIGH') severityEnum = 'HIGH';
    else if (csvSeverity === 'CRITICAL') severityEnum = 'CRITICAL';
    else if (csvSeverity === 'LOW') severityEnum = 'LOW';

    const typeId = incidentTypesMap[r.Incident_Type] || Object.values(incidentTypesMap)[0];
    const barangayId = barangaysMap[r.Barangay] || null;
    const reportedAt = new Date(`${r.Date_Reported}T${r.Time_Reported || '12:00:00'}Z`);

    try {
      await prisma.incident.upsert({
        where: { incident_code: r.Incident_ID },
        update: {
          status: statusEnum,
          severity: severityEnum,
          city: "Talisay City",
          district_id: district.district_id
        },
        create: {
          incident_code: r.Incident_ID,
          reported_by: reporterUser.user_id,
          incident_type_id: typeId,
          barangay_id: barangayId,
          city: "Talisay City",
          district_id: district.district_id,
          description: `${r.Incident_Type}: ${r.Probable_Cause || 'Emergency Incident Report'}`,
          landmark: r.Probable_Cause || null,
          latitude: lat,
          longitude: lng,
          map_pin_address: `${r.Barangay}, Talisay City, Negros Occidental`,
          status: statusEnum,
          severity: severityEnum,
          reported_at: reportedAt,
          reporter_name: r.Reporting_Agency || "System Import",
          reporter_phone: "+639179999999"
        }
      });
      insertedCount++;
    } catch (err) {
      console.error(`Failed ${r.Incident_ID}:`, err.message);
    }
  }

  console.log(`\n--- IMPORT COMPLETE ---`);
  console.log(`Total Records: ${csvRecords.length}`);
  console.log(`Inserted Land Incidents: ${insertedCount}`);
  console.log(`Filtered Sea Incidents: ${seaFilteredCount}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
