
import { prisma } from './src/config/database.js';
import ExcelJS from 'exceljs';
import fs from 'fs';

async function testExport() {
  try {
    console.log('Testing Excel Export...');
    const incidents = await prisma.incident.findMany({
      include: {
        incident_type: true,
        barangay: true,
        reporter: { select: { name: true, email: true, contact_number: true } },
        assignments: { include: { unit: true } },
      },
      take: 10,
    });

    console.log(`Found ${incidents.length} incidents`);

    const rows = incidents.map((inc) => ({
      'Incident Code': inc.incident_code,
      'Type': inc.incident_type?.name || 'Unknown',
      'Status': inc.status,
      'Severity': inc.severity,
      'Priority': inc.priority,
      'Description': inc.description,
      'Location': inc.map_pin_address || `${inc.latitude}, ${inc.longitude}`,
      'Latitude': inc.latitude,
      'Longitude': inc.longitude,
      'Barangay': inc.barangay?.name || 'N/A',
      'Reporter Name': inc.reporter?.name || inc.reporter_name || 'Anonymous',
      'Reporter Phone': inc.reporter?.contact_number || inc.reporter_phone || 'N/A',
      'Reporter Email': inc.reporter?.email || 'N/A',
      'Assigned Units': inc.assignments?.map(a => a.unit?.unit_name).filter(Boolean).join(', ') || 'None',
      'Reported At': inc.reported_at ? new Date(inc.reported_at).toLocaleString('en-PH') : '',
      'Last Updated': inc.updated_at ? new Date(inc.updated_at).toLocaleString('en-PH') : '',
    }));

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Incidents');
    worksheet.columns = Object.keys(rows[0]).map((key) => ({ header: key, key }));
    rows.forEach(row => worksheet.addRow(row));

    const buffer = await workbook.xlsx.writeBuffer();
    fs.writeFileSync('test_export.xlsx', buffer);
    console.log('Successfully wrote test_export.xlsx');

  } catch (err) {
    console.error('Export test failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

testExport();
