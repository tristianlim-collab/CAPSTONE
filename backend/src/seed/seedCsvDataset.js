import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

function parseCsvLine(line) {
  const result = [];
  let start = 0;
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') {
      inQuotes = !inQuotes;
    } else if (line[i] === ',' && !inQuotes) {
      let field = line.substring(start, i).trim();
      if (field.startsWith('"') && field.endsWith('"')) {
        field = field.substring(1, field.length - 1);
      }
      result.push(field);
      start = i + 1;
    }
  }
  let field = line.substring(start).trim();
  if (field.startsWith('"') && field.endsWith('"')) {
    field = field.substring(1, field.length - 1);
  }
  result.push(field);
  return result;
}

export async function seedCsvDataset() {
  console.log('🚀 Starting Fast Talisay City Historical Dataset Seeding...');

  const possiblePaths = [
    path.resolve(__dirname, '../data/Talisay_City_DRRMO_BFP_Incident_Reports-1.csv'),
    path.resolve(__dirname, '../../../Talisay_City_DRRMO_BFP_Incident_Reports-1.csv'),
    path.resolve(process.cwd(), 'Talisay_City_DRRMO_BFP_Incident_Reports-1.csv'),
    path.resolve(process.cwd(), 'src/data/Talisay_City_DRRMO_BFP_Incident_Reports-1.csv')
  ];

  let csvPath = possiblePaths.find(p => fs.existsSync(p));
  if (!csvPath) {
    console.error('❌ CSV file not found in any of the search paths:', possiblePaths);
    return;
  }

  console.log('📂 Found CSV dataset at:', csvPath);
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim().length > 0);
  console.log(`📄 Found ${lines.length - 1} records in CSV.`);

  // 1. Ensure Incident Types Exist
  const defaultIncidentTypes = [
    { name: 'Infrastructure Damage', color_code: '#8B5CF6', icon_label: '🏗️', default_unit_type: 'DRRMO' },
    { name: 'Fire Incident', color_code: '#EF4444', icon_label: '🔥', default_unit_type: 'FIRE' },
    { name: 'Landslide', color_code: '#D97706', icon_label: '⛰️', default_unit_type: 'DRRMO' },
    { name: 'Medical Emergency', color_code: '#10B981', icon_label: '🚑', default_unit_type: 'MEDICAL' },
    { name: 'Flood/Typhoon', color_code: '#3B82F6', icon_label: '🌊', default_unit_type: 'DRRMO' },
    { name: 'Vehicular Accident', color_code: '#F59E0B', icon_label: '🚗', default_unit_type: 'POLICE' },
    { name: 'Other Emergency', color_code: '#6B7280', icon_label: '⚠️', default_unit_type: 'BARANGAY' },
    { name: 'Chemical Leak', color_code: '#EC4899', icon_label: '☣️', default_unit_type: 'DRRMO' }
  ];

  const incidentTypeMap = new Map();
  for (const typeData of defaultIncidentTypes) {
    let existing = await prisma.incidentType.findFirst({
      where: { name: { equals: typeData.name, mode: 'insensitive' } }
    });
    if (!existing) {
      existing = await prisma.incidentType.create({ data: typeData });
    }
    incidentTypeMap.set(typeData.name.toLowerCase(), existing.type_id);
  }

  // 2. Fetch existing codes & barangays in batch
  const existingCodesSet = new Set(
    (await prisma.incident.findMany({ select: { incident_code: true } })).map(i => i.incident_code)
  );

  const barangays = await prisma.barangay.findMany();
  const barangayMap = new Map();
  barangays.forEach(b => barangayMap.set(b.name.toLowerCase(), b.barangay_id));

  // Collect unique new barangays from CSV
  const missingBarangays = new Set();
  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvLine(lines[i]);
    if (row.length < 13) continue;
    const bgyName = row[12];
    if (bgyName && !barangayMap.has(bgyName.toLowerCase())) {
      missingBarangays.add(bgyName);
    }
  }

  for (const bgyName of missingBarangays) {
    const newBgy = await prisma.barangay.create({
      data: {
        name: bgyName,
        municipality: 'Talisay City',
        city: 'Talisay City',
        congressional_district: 'Negros Occidental - 3rd District',
        boundary_geojson: {}
      }
    });
    barangayMap.set(bgyName.toLowerCase(), newBgy.barangay_id);
  }

  const statusEnumMap = {
    'closed': 'CLOSED',
    'resolved': 'RESOLVED',
    'ongoing': 'RESPONDING',
    'false alarm': 'FALSE_ALARM',
    'reported': 'REPORTED'
  };

  const severityEnumMap = {
    'low': 'LOW',
    'medium': 'HIGH',
    'high': 'HIGH',
    'critical': 'CRITICAL'
  };

  const newRecords = [];
  let skippedCount = 0;

  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvLine(lines[i]);
    if (row.length < 15) continue;

    const [
      incident_id_code,
      reporting_agency,
      date_reported,
      time_reported,
      incident_type_name,
      ndrrmc_hazard_class,
      ndrrmc_report_type,
      probable_cause,
      severity_str,
      district,
      lgu_type,
      city_municipality,
      barangay_name,
      latitude_str,
      longitude_str,
      response_time_min,
      units_deployed,
      casualties,
      estimated_damage,
      status_str
    ] = row;

    if (existingCodesSet.has(incident_id_code)) {
      skippedCount++;
      continue;
    }

    const lat = parseFloat(latitude_str);
    const lng = parseFloat(longitude_str);
    if (isNaN(lat) || isNaN(lng)) continue;

    const barangayId = barangayMap.get((barangay_name || '').toLowerCase()) || null;
    let typeId = incidentTypeMap.get((incident_type_name || '').toLowerCase());
    if (!typeId) {
      typeId = Array.from(incidentTypeMap.values())[0];
    }

    const reportedAt = new Date(`${date_reported}T${time_reported || '00:00:00'}`);
    const status = statusEnumMap[(status_str || '').toLowerCase()] || 'RESOLVED';
    const severity = severityEnumMap[(severity_str || '').toLowerCase()] || 'HIGH';
    const description = probable_cause ? `${incident_type_name}: ${probable_cause}` : `${incident_type_name} reported in ${barangay_name}`;
    const map_pin_address = `${barangay_name}, ${city_municipality || 'Talisay City'}, Negros Occidental`;

    newRecords.push({
      incident_code: incident_id_code,
      incident_type_id: typeId,
      barangay_id: barangayId,
      description,
      latitude: lat,
      longitude: lng,
      map_pin_address,
      status,
      severity,
      reported_at: reportedAt,
      landmark: reporting_agency ? `Reporting Agency: ${reporting_agency}` : null
    });
  }

  if (newRecords.length > 0) {
    console.log(`📦 Batch inserting ${newRecords.length} records...`);
    await prisma.incident.createMany({
      data: newRecords,
      skipDuplicates: true
    });
  }

  console.log(`✅ Seeding Complete!`);
  console.log(`✨ Inserted: ${newRecords.length} incidents`);
  console.log(`⏩ Skipped (already exist): ${skippedCount}`);
}

if (process.argv[1] && process.argv[1].endsWith('seedCsvDataset.js')) {
  seedCsvDataset()
    .catch(err => {
      console.error('❌ Fast Seeding error:', err);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
