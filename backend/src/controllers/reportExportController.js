import { prisma } from '../config/database.js';
import ExcelJS from 'exceljs';

/**
 * Export incidents as Excel (.xlsx) or CSV
 * GET /api/reports/export?format=xlsx&startDate=...&endDate=...&status=...&type_id=...
 */
export const exportIncidents = async (req, res) => {
  try {
    const { format = 'xlsx', startDate, endDate, status, type_id, severity } = req.query;

    // Build filter
    const where = {};
    if (status && status !== 'ALL') where.status = status;
    if (type_id && type_id !== 'ALL') where.incident_type_id = type_id;
    if (severity && severity !== 'ALL') where.severity = severity;
    if (startDate || endDate) {
      where.reported_at = {};
      if (startDate) where.reported_at.gte = new Date(startDate);
      if (endDate) where.reported_at.lte = new Date(endDate);
    }

    const incidents = await prisma.incident.findMany({
      where,
      include: {
        incident_type: true,
        barangay: true,
        reporter: { select: { name: true, email: true, contact_number: true } },
        assignments: { include: { unit: true } },
      },
      orderBy: { reported_at: 'desc' },
      take: 5000, // Safety limit
    });

    if (incidents.length === 0) {
      return res.status(404).json({ message: 'No incidents found matching the filters.' });
    }

    // Transform to flat export rows
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
    workbook.creator = 'GAOIRS';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Incidents', {
      properties: { tabColor: { argb: '4F46E5' } },
    });

    // Define columns with widths
    worksheet.columns = Object.keys(rows[0]).map((key) => ({
      header: key,
      key,
      width: key === 'Description' ? 40 : key === 'Location' ? 30 : 18,
    }));

    // Style header row
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F46E5' }, // Indigo
    };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 28;

    // Add data rows
    rows.forEach((row) => {
      const dataRow = worksheet.addRow(row);
      dataRow.alignment = { vertical: 'middle', wrapText: true };
    });

    // Add borders and alternating row colors
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
      });
      if (rowNumber > 1 && rowNumber % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8FAFC' }, // Light gray
        };
      }
    });

    // Add summary row at the bottom
    worksheet.addRow([]); // Empty row
    const summaryRow = worksheet.addRow(['Summary', '', '', '', '', `Total: ${rows.length} incidents`, '', '', '', '', '', '', '', '', `Generated: ${new Date().toLocaleString('en-PH')}`]);
    summaryRow.font = { bold: true, italic: true, color: { argb: 'FF64748B' } };

    // Auto-filter
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: worksheet.columns.length },
    };

    // Freeze header row
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

    if (format === 'csv') {
      // CSV export
      const buffer = await workbook.csv.writeBuffer();
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="GAOIRS_Incidents_${timestamp}.csv"`);
      return res.send(buffer);
    } else {
      // Excel (.xlsx) export
      const buffer = await workbook.xlsx.writeBuffer();
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="GAOIRS_Incidents_${timestamp}.xlsx"`);
      return res.send(buffer);
    }
  } catch (err) {
    console.error('Export error:', err);
    return res.status(500).json({ message: 'Error generating export', error: err.message });
  }
};

/**
 * Export incidents as PDF using Puppeteer for high-quality rendering
 * GET /api/reports/export/pdf?startDate=...&endDate=...&status=...
 */
export const exportIncidentsPDF = async (req, res) => {
  try {
    const { startDate, endDate, status, type_id, severity } = req.query;

    // Build filter
    const where = {};
    if (status && status !== 'ALL') where.status = status;
    if (type_id && type_id !== 'ALL') where.incident_type_id = type_id;
    if (severity && severity !== 'ALL') where.severity = severity;
    if (startDate || endDate) {
      where.reported_at = {};
      if (startDate) where.reported_at.gte = new Date(startDate);
      if (endDate) where.reported_at.lte = new Date(endDate);
    }

    const incidents = await prisma.incident.findMany({
      where,
      include: {
        incident_type: true,
        barangay: true,
        reporter: { select: { name: true, email: true, contact_number: true } },
        assignments: { include: { unit: true } },
      },
      orderBy: { reported_at: 'desc' },
      take: 500, // Lower limit for PDF to avoid memory issues
    });

    if (incidents.length === 0) {
      return res.status(404).json({ message: 'No incidents found matching the filters.' });
    }

    const fmt = (d) => d ? new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

    // Build HTML for PDF
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; padding: 40px; font-size: 11px; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #4f46e5; padding-bottom: 20px; }
        .header h1 { font-size: 22px; color: #4f46e5; margin-bottom: 4px; }
        .header p { font-size: 12px; color: #64748b; }
        .summary { display: flex; gap: 20px; margin-bottom: 24px; }
        .summary-card { flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; text-align: center; }
        .summary-card .label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; font-weight: 700; }
        .summary-card .value { font-size: 20px; font-weight: 900; color: #1e293b; margin-top: 4px; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th { background: #4f46e5; color: white; padding: 8px 10px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
        td { padding: 7px 10px; border-bottom: 1px solid #e2e8f0; font-size: 10px; }
        tr:nth-child(even) { background: #f8fafc; }
        tr:hover { background: #eef2ff; }
        .status { display: inline-block; padding: 2px 8px; border-radius: 4px; font-weight: 700; font-size: 9px; text-transform: uppercase; }
        .status-REPORTED { background: #fef3c7; color: #d97706; }
        .status-VERIFIED { background: #dbeafe; color: #2563eb; }
        .status-RESPONDING { background: #e0e7ff; color: #4f46e5; }
        .status-ON_SCENE { background: #fce7f3; color: #db2777; }
        .status-RESOLVED { background: #d1fae5; color: #059669; }
        .status-CLOSED { background: #f1f5f9; color: #475569; }
        .status-FALSE_ALARM { background: #fee2e2; color: #dc2626; }
        .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px; }
        @page { margin: 20px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>GAOIRS — Incident Report</h1>
        <p>Generated on ${new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        ${startDate || endDate ? `<p style="margin-top:4px">Period: ${startDate || 'Start'} to ${endDate || 'Present'}</p>` : ''}
      </div>

      <div class="summary">
        <div class="summary-card"><div class="label">Total Incidents</div><div class="value">${incidents.length}</div></div>
        <div class="summary-card"><div class="label">Resolved</div><div class="value">${incidents.filter(i => i.status === 'RESOLVED').length}</div></div>
        <div class="summary-card"><div class="label">Active</div><div class="value">${incidents.filter(i => ['REPORTED', 'VERIFIED', 'RESPONDING', 'ON_SCENE'].includes(i.status)).length}</div></div>
        <div class="summary-card"><div class="label">False Alarms</div><div class="value">${incidents.filter(i => i.status === 'FALSE_ALARM').length}</div></div>
      </div>

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Code</th>
            <th>Type</th>
            <th>Status</th>
            <th>Severity</th>
            <th>Location</th>
            <th>Reporter</th>
            <th>Assigned Units</th>
            <th>Reported At</th>
          </tr>
        </thead>
        <tbody>
          ${incidents.map((inc, idx) => `
          <tr>
            <td>${idx + 1}</td>
            <td><strong>${inc.incident_code}</strong></td>
            <td>${inc.incident_type?.name || 'Unknown'}</td>
            <td><span class="status status-${inc.status}">${inc.status.replace('_', ' ')}</span></td>
            <td>${inc.severity}</td>
            <td>${inc.map_pin_address || `${inc.latitude.toFixed(4)}, ${inc.longitude.toFixed(4)}`}</td>
            <td>${inc.reporter?.name || inc.reporter_name || 'Anonymous'}</td>
            <td>${inc.assignments?.map(a => a.unit?.unit_name).filter(Boolean).join(', ') || '—'}</td>
            <td>${fmt(inc.reported_at)}</td>
          </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="footer">
        <p>GAOIRS — Government Agency Operations Incident Response System &bull; Confidential Report</p>
        <p>Page 1 of 1 &bull; ${incidents.length} records</p>
      </div>
    </body>
    </html>`;

    // Use Puppeteer to generate PDF
    const puppeteer = await import('puppeteer');
    const browser = await puppeteer.default.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' },
    });
    await browser.close();

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="GAOIRS_Report_${timestamp}.pdf"`);
    return res.send(pdfBuffer);
  } catch (err) {
    console.error('PDF export error:', err);
    return res.status(500).json({ message: 'Error generating PDF report', error: err.message });
  }
};
