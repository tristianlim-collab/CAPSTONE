import { prisma } from '../config/database.js';
import ExcelJS from 'exceljs';
import puppeteer from 'puppeteer';
import fs from 'fs';
import PDFDocument from 'pdfkit';
import { tagSameReports } from './incidentController.js';

/**
 * Helper: Generate PDF for Incidents using PDFKit (0 browser dependencies)
 */
const generateIncidentsPDFKit = (incidents, res) => {
  const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="GAOIRS_Incidents_Report_${timestamp}.pdf"`);

  doc.pipe(res);

  // Header Banner
  doc.rect(0, 0, doc.page.width, 50).fill('#4F46E5');
  doc.fillColor('#FFFFFF').fontSize(16).font('Helvetica-Bold').text('GAOIRS — INCIDENT EMERGENCY REPORT', 30, 15);
  doc.fontSize(9).font('Helvetica').text(`Generated: ${new Date().toLocaleString('en-PH')} | Records: ${incidents.length}`, 30, 34);

  // Summary Metrics
  const total = incidents.length;
  const resolved = incidents.filter(i => i.status === 'RESOLVED').length;
  const active = incidents.filter(i => ['REPORTED', 'VERIFIED', 'RESPONDING', 'ON_SCENE'].includes(i.status)).length;
  const sameReports = incidents.filter(i => i.same_report_tag?.is_same_report).length;

  const metricY = 62;
  const boxW = 180;
  const boxes = [
    { label: 'TOTAL INCIDENTS', val: `${total}`, color: '#EEF2FF', border: '#C7D2FE', txt: '#3730A3' },
    { label: 'ACTIVE INCIDENTS', val: `${active}`, color: '#FEF3C7', border: '#FDE68A', txt: '#92400E' },
    { label: 'RESOLVED', val: `${resolved}`, color: '#D1FAE5', border: '#A7F3D0', txt: '#065F46' },
    { label: 'SAME REPORT TAGS', val: `${sameReports}`, color: '#FED7AA', border: '#FDBA74', txt: '#9A3412' }
  ];

  boxes.forEach((box, i) => {
    const x = 30 + i * 195;
    doc.rect(x, metricY, boxW, 35).fillAndStroke(box.color, box.border);
    doc.fillColor('#64748B').fontSize(7).font('Helvetica-Bold').text(box.label, x + 10, metricY + 6);
    doc.fillColor(box.txt).fontSize(14).font('Helvetica-Bold').text(box.val, x + 10, metricY + 16);
  });

  // Table Setup
  const startY = 110;
  const headers = ['#', 'Incident Code', 'Type', 'Status', 'Severity', 'Location', 'Reporter', 'Same Report Tag', 'Date'];
  const colWidths = [25, 120, 90, 75, 55, 130, 95, 100, 90];

  let currentY = startY;

  // Draw Header Row
  doc.rect(30, currentY, 780, 20).fill('#312E81');
  doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(8);

  let currentX = 35;
  headers.forEach((h, i) => {
    doc.text(h, currentX, currentY + 5, { width: colWidths[i], truncate: true });
    currentX += colWidths[i];
  });

  currentY += 22;
  doc.font('Helvetica').fontSize(8);

  incidents.forEach((inc, idx) => {
    if (currentY > 520) {
      doc.addPage({ margin: 30, size: 'A4', layout: 'landscape' });
      currentY = 40;
      doc.rect(30, currentY, 780, 20).fill('#312E81');
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(8);
      let posX = 35;
      headers.forEach((h, i) => {
        doc.text(h, posX, currentY + 5, { width: colWidths[i], truncate: true });
        posX += colWidths[i];
      });
      currentY += 22;
      doc.font('Helvetica').fontSize(8);
    }

    if (idx % 2 === 0) {
      doc.rect(30, currentY - 2, 780, 18).fill('#F8FAFC');
    }

    doc.fillColor('#1E293B');
    let x = 35;

    doc.text(`${idx + 1}`, x, currentY, { width: colWidths[0] });
    x += colWidths[0];

    doc.font('Helvetica-Bold').fillColor('#4F46E5').text(inc.incident_code || '', x, currentY, { width: colWidths[1] });
    x += colWidths[1];

    doc.font('Helvetica').fillColor('#1E293B').text(inc.incident_type?.name || 'Unknown', x, currentY, { width: colWidths[2], truncate: true });
    x += colWidths[2];

    doc.text(inc.status || '', x, currentY, { width: colWidths[3] });
    x += colWidths[3];

    doc.text(inc.severity || '', x, currentY, { width: colWidths[4] });
    x += colWidths[4];

    doc.text(inc.map_pin_address || inc.barangay?.name || 'N/A', x, currentY, { width: colWidths[5], truncate: true });
    x += colWidths[5];

    doc.text(inc.reporter?.name || inc.reporter_name || 'Resident', x, currentY, { width: colWidths[6], truncate: true });
    x += colWidths[6];

    const isSame = inc.same_report_tag?.is_same_report;
    const sameStr = isSame ? `SAME REPORT (${inc.same_report_tag.group_count})` : 'UNIQUE';
    if (isSame) {
      doc.font('Helvetica-Bold').fillColor('#D97706').text(sameStr, x, currentY, { width: colWidths[7], truncate: true });
    } else {
      doc.font('Helvetica').fillColor('#64748B').text(sameStr, x, currentY, { width: colWidths[7], truncate: true });
    }
    x += colWidths[7];

    const dStr = inc.reported_at ? new Date(inc.reported_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
    doc.font('Helvetica').fillColor('#1E293B').text(dStr, x, currentY, { width: colWidths[8] });

    currentY += 18;
  });

  doc.fontSize(8).fillColor('#94A3B8').text('GAOIRS — Government Agency Operations Incident Response System • Confidential Intelligence Document', 30, doc.page.height - 25, { align: 'center' });

  doc.end();
};

/**
 * Helper: Generate PDF for Post-Incident Reports using PDFKit
 */
const generatePostReportsPDFKit = (reports, res) => {
  const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'portrait' });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="GAOIRS_PostIncident_Report_${timestamp}.pdf"`);

  doc.pipe(res);

  doc.rect(0, 0, doc.page.width, 50).fill('#4F46E5');
  doc.fillColor('#FFFFFF').fontSize(16).font('Helvetica-Bold').text('GAOIRS — POST-INCIDENT ANALYSIS REPORT', 30, 15);
  doc.fontSize(9).font('Helvetica').text(`Generated: ${new Date().toLocaleString('en-PH')} | Reports: ${reports.length}`, 30, 34);

  let currentY = 70;
  const headers = ['Code', 'Type', 'Submitted By', 'Response (min)', 'Status', 'Submitted Date'];
  const colWidths = [100, 100, 100, 70, 70, 90];

  doc.rect(30, currentY, 535, 20).fill('#312E81');
  doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(8);

  let currentX = 35;
  headers.forEach((h, i) => {
    doc.text(h, currentX, currentY + 5, { width: colWidths[i], truncate: true });
    currentX += colWidths[i];
  });

  currentY += 22;
  doc.font('Helvetica').fontSize(8);

  reports.forEach((r, idx) => {
    if (currentY > 750) {
      doc.addPage({ margin: 30, size: 'A4', layout: 'portrait' });
      currentY = 40;
      doc.rect(30, currentY, 535, 20).fill('#312E81');
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(8);
      let posX = 35;
      headers.forEach((h, i) => {
        doc.text(h, posX, currentY + 5, { width: colWidths[i], truncate: true });
        posX += colWidths[i];
      });
      currentY += 22;
      doc.font('Helvetica').fontSize(8);
    }

    if (idx % 2 === 0) {
      doc.rect(30, currentY - 2, 535, 18).fill('#F8FAFC');
    }

    doc.fillColor('#1E293B');
    let x = 35;

    doc.font('Helvetica-Bold').fillColor('#4F46E5').text(r.incident?.incident_code || 'N/A', x, currentY, { width: colWidths[0] });
    x += colWidths[0];

    doc.font('Helvetica').fillColor('#1E293B').text(r.incident?.incident_type?.name || 'N/A', x, currentY, { width: colWidths[1], truncate: true });
    x += colWidths[1];

    doc.text(r.submitter?.name || 'N/A', x, currentY, { width: colWidths[2], truncate: true });
    x += colWidths[2];

    doc.text(`${r.response_time_minutes || 0}m`, x, currentY, { width: colWidths[3] });
    x += colWidths[3];

    doc.text(r.status || 'SUBMITTED', x, currentY, { width: colWidths[4] });
    x += colWidths[4];

    const dStr = r.submitted_at ? new Date(r.submitted_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
    doc.text(dStr, x, currentY, { width: colWidths[5] });

    currentY += 18;
  });

  doc.fontSize(8).fillColor('#94A3B8').text('GAOIRS — Government Agency Operations Incident Response System • Confidential Document', 30, doc.page.height - 25, { align: 'center' });

  doc.end();
};

/**
 * Export incidents as Excel (.xlsx) or CSV
 * GET /api/reports/export?format=xlsx&startDate=...&endDate=...&status=...&type_id=...
 */
export const exportIncidents = async (req, res) => {
  try {
    const { format = 'xlsx', startDate, endDate, status, type_id, severity } = req.query;

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
      take: 5000,
    });

    if (incidents.length === 0) {
      return res.status(404).json({ message: 'No incidents found matching the filters.' });
    }

    const taggedIncidents = tagSameReports(incidents);

    const rows = taggedIncidents.map((inc) => ({
      'Incident Code': inc.incident_code,
      'Type': inc.incident_type?.name || 'Unknown',
      'Status': inc.status,
      'Severity': inc.severity,
      'Priority': inc.priority,
      'Same Report Tag': inc.same_report_tag?.is_same_report ? `SAME REPORT (${inc.same_report_tag.group_count})` : 'UNIQUE',
      'Primary Incident': inc.same_report_tag?.primary_code || inc.incident_code,
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

    worksheet.columns = Object.keys(rows[0]).map((key) => ({
      header: key,
      key,
      width: key === 'Description' ? 40 : key === 'Location' ? 30 : 20,
    }));

    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F46E5' },
    };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 28;

    rows.forEach((row) => {
      const dataRow = worksheet.addRow(row);
      dataRow.alignment = { vertical: 'middle', wrapText: true };
    });

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
          fgColor: { argb: 'FFF8FAFC' },
        };
      }
    });

    worksheet.addRow([]);
    const summaryRow = worksheet.addRow(['Summary', '', '', '', '', '', `Total: ${rows.length} incidents`, '', '', '', '', '', '', '', '', '', `Generated: ${new Date().toLocaleString('en-PH')}`]);
    summaryRow.font = { bold: true, italic: true, color: { argb: 'FF64748B' } };

    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: worksheet.columns.length },
    };

    worksheet.views = [{ state: 'frozen', ySplit: 1 }];

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

    if (format === 'csv') {
      const buffer = await workbook.csv.writeBuffer();
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="GAOIRS_Incidents_${timestamp}.csv"`);
      return res.send(buffer);
    } else {
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
 * Export incidents as PDF (Uses PDFKit guaranteed engine with Puppeteer fallback)
 * GET /api/reports/export/pdf?startDate=...&endDate=...&status=...
 */
export const exportIncidentsPDF = async (req, res) => {
  try {
    const { startDate, endDate, status, type_id, severity } = req.query;

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
      take: 1000,
    });

    if (incidents.length === 0) {
      return res.status(404).json({ message: 'No incidents found matching the filters.' });
    }

    const taggedIncidents = tagSameReports(incidents);

    // Try Puppeteer if available
    const commonPaths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      process.env.PUPPETEER_EXECUTABLE_PATH
    ].filter(Boolean);

    let executablePath = commonPaths.find(p => fs.existsSync(p));

    if (executablePath) {
      try {
        const fmt = (d) => d ? new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; padding: 30px; font-size: 10px; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 3px solid #4f46e5; padding-bottom: 15px; }
            .header h1 { font-size: 20px; color: #4f46e5; margin-bottom: 4px; font-weight: 900; }
            .header p { font-size: 11px; color: #64748b; }
            .summary { display: flex; gap: 15px; margin-bottom: 20px; }
            .summary-card { flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; text-align: center; }
            .summary-card .label { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; font-weight: 700; }
            .summary-card .value { font-size: 18px; font-weight: 900; color: #1e293b; margin-top: 2px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { background: #4f46e5; color: white; padding: 7px 8px; text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; }
            td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-size: 9px; vertical-align: middle; }
            tr:nth-child(even) { background: #f8fafc; }
            .badge-tag { display: inline-block; padding: 2px 6px; border-radius: 4px; font-weight: 800; font-size: 8px; text-transform: uppercase; }
            .badge-same { background: #fef3c7; color: #d97706; border: 1px solid #fcd34d; }
            .badge-unique { background: #f1f5f9; color: #64748b; }
            .status { display: inline-block; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 8px; text-transform: uppercase; }
            .status-REPORTED { background: #fef3c7; color: #d97706; }
            .status-VERIFIED { background: #dbeafe; color: #2563eb; }
            .status-RESPONDING { background: #e0e7ff; color: #4f46e5; }
            .status-ON_SCENE { background: #fce7f3; color: #db2777; }
            .status-RESOLVED { background: #d1fae5; color: #059669; }
            .status-FALSE_ALARM { background: #fee2e2; color: #dc2626; }
            .footer { margin-top: 20px; text-align: center; font-size: 9px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>GAOIRS — Incident Intelligence Report</h1>
            <p>Generated on ${new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          </div>

          <div class="summary">
            <div class="summary-card"><div class="label">Total Incidents</div><div class="value">${taggedIncidents.length}</div></div>
            <div class="summary-card"><div class="label">Resolved</div><div class="value">${taggedIncidents.filter(i => i.status === 'RESOLVED').length}</div></div>
            <div class="summary-card"><div class="label">Active</div><div class="value">${taggedIncidents.filter(i => ['REPORTED', 'VERIFIED', 'RESPONDING', 'ON_SCENE'].includes(i.status)).length}</div></div>
            <div class="summary-card"><div class="label">Same Report Tagged</div><div class="value">${taggedIncidents.filter(i => i.same_report_tag?.is_same_report).length}</div></div>
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
                <th>Same Report Tag</th>
                <th>Reported At</th>
              </tr>
            </thead>
            <tbody>
              ${taggedIncidents.map((inc, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td><strong>${inc.incident_code}</strong></td>
                <td>${inc.incident_type?.name || 'Unknown'}</td>
                <td><span class="status status-${inc.status}">${inc.status.replace('_', ' ')}</span></td>
                <td>${inc.severity}</td>
                <td>${inc.map_pin_address || `${inc.latitude.toFixed(4)}, ${inc.longitude.toFixed(4)}`}</td>
                <td>${inc.reporter?.name || inc.reporter_name || 'Anonymous'}</td>
                <td>
                  ${inc.same_report_tag?.is_same_report
                    ? `<span class="badge-tag badge-same">SAME REPORT (${inc.same_report_tag.group_count})</span>`
                    : `<span class="badge-tag badge-unique">UNIQUE</span>`}
                </td>
                <td>${fmt(inc.reported_at)}</td>
              </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            <p>GAOIRS — Government Agency Operations Incident Response System &bull; Confidential Report</p>
          </div>
        </body>
        </html>`;

        const browser = await puppeteer.launch({
          headless: 'new',
          executablePath,
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
        });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });
        const pdfBuffer = await page.pdf({ format: 'A4', landscape: true, printBackground: true, margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' } });
        await browser.close();

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="GAOIRS_Report_${timestamp}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        return res.end(pdfBuffer);
      } catch (pErr) {
        console.warn('Puppeteer launch failed, using PDFKit fallback:', pErr.message);
      }
    }

    // Direct PDFKit fallback
    return generateIncidentsPDFKit(taggedIncidents, res);
  } catch (err) {
    console.error('PDF export error:', err);
    return res.status(500).json({ message: 'Error generating PDF report', error: err.message });
  }
};

/**
 * Export post-incident reports as Excel (.xlsx) or CSV
 * GET /api/reports/export/post-reports?format=xlsx&startDate=...&endDate=...&type_id=...&search=...
 */
export const exportPostReports = async (req, res) => {
  try {
    const { format = 'xlsx', startDate, endDate, type_id, search } = req.query;

    const where = {};
    if (type_id && type_id !== 'ALL') {
      where.incident = { incident_type_id: type_id };
    }
    if (startDate || endDate) {
      where.submitted_at = {};
      if (startDate) where.submitted_at.gte = new Date(startDate);
      if (endDate) where.submitted_at.lte = new Date(endDate);
    }
    if (search) {
      where.OR = [
        { incident: { incident_code: { contains: search, mode: 'insensitive' } } },
        { actions_taken: { contains: search, mode: 'insensitive' } }
      ];
    }

    const reports = await prisma.postIncidentReport.findMany({
      where,
      include: {
        incident: { include: { incident_type: true, barangay: true } },
        submitter: { select: { name: true, email: true, role: true } },
      },
      orderBy: { submitted_at: 'desc' },
      take: 5000,
    });

    if (reports.length === 0) {
      return res.status(404).json({ message: 'No reports found matching the filters.' });
    }

    const rows = reports.map((r) => ({
      'Incident Code': r.incident?.incident_code || 'N/A',
      'Incident Type': r.incident?.incident_type?.name || 'N/A',
      'Location': r.incident?.barangay?.name || 'N/A',
      'Submitted By': r.submitter?.name || 'N/A',
      'Report Status': r.status,
      'Response Time (Min)': r.response_time_minutes || 'N/A',
      'Casualties': r.casualties || 0,
      'Actions Taken': r.actions_taken,
      'Admin Notes': r.admin_notes || 'N/A',
      'Reported Date': r.incident?.reported_at ? new Date(r.incident.reported_at).toLocaleString('en-PH') : 'N/A',
      'Submitted Date': r.submitted_at ? new Date(r.submitted_at).toLocaleString('en-PH') : 'N/A',
    }));

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Post Incident Reports');

    worksheet.columns = Object.keys(rows[0]).map((key) => ({
      header: key,
      key,
      width: ['Actions Taken', 'Admin Notes'].includes(key) ? 50 : 20,
    }));

    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };

    rows.forEach((row) => {
      worksheet.addRow(row).alignment = { wrapText: true, vertical: 'middle' };
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

    if (format === 'csv') {
      const buffer = await workbook.csv.writeBuffer();
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="GAOIRS_PostReports_${timestamp}.csv"`);
      return res.send(buffer);
    } else {
      const buffer = await workbook.xlsx.writeBuffer();
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="GAOIRS_PostReports_${timestamp}.xlsx"`);
      return res.send(buffer);
    }
  } catch (err) {
    console.error('Export error:', err);
    return res.status(500).json({ message: 'Error generating export', error: err.message });
  }
};

/**
 * Export post-incident reports as PDF
 * GET /api/reports/export/post-reports/pdf?startDate=...&endDate=...&type_id=...&search=...
 */
export const exportPostReportsPDF = async (req, res) => {
  try {
    const { startDate, endDate, type_id, search, report_id } = req.query;

    const where = {};
    if (report_id) {
      where.report_id = report_id;
    } else {
      if (type_id && type_id !== 'ALL') {
        where.incident = { incident_type_id: type_id };
      }
      if (startDate || endDate) {
        where.submitted_at = {};
        if (startDate) where.submitted_at.gte = new Date(startDate);
        if (endDate) where.submitted_at.lte = new Date(endDate);
      }
      if (search) {
        where.OR = [
          { incident: { incident_code: { contains: search, mode: 'insensitive' } } },
          { actions_taken: { contains: search, mode: 'insensitive' } }
        ];
      }
    }

    const reports = await prisma.postIncidentReport.findMany({
      where,
      include: {
        incident: {
          include: {
            incident_type: true,
            barangay: true,
            evidence: true,
          }
        },
        submitter: { select: { name: true, email: true, role: true } },
      },
      orderBy: { submitted_at: 'desc' },
      take: report_id ? 1 : 500,
    });

    if (reports.length === 0) {
      return res.status(404).json({ message: 'No reports found.' });
    }

    // Try Puppeteer if available
    const commonPaths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      process.env.PUPPETEER_EXECUTABLE_PATH
    ].filter(Boolean);

    let executablePath = commonPaths.find(p => fs.existsSync(p));

    if (executablePath) {
      try {
        const fmt = (d) => d ? new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; padding: 25px; font-size: 9px; line-height: 1.3; }
            .header { text-align: center; margin-bottom: 12px; border-bottom: 2px solid #4f46e5; padding-bottom: 8px; }
            .header h1 { font-size: 16px; color: #4f46e5; margin-bottom: 2px; }
            table { width: 100%; border-collapse: collapse; margin-top: 5px; }
            th { background: #4f46e5; color: white; padding: 5px; text-align: left; font-size: 8px; text-transform: uppercase; }
            td { padding: 5px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
            tr:nth-child(even) { background: #f8fafc; }
            .code { font-family: monospace; font-weight: 700; color: #4f46e5; }
            .footer { margin-top: 15px; text-align: center; font-size: 8px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 5px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>GAOIRS — Post-Incident Analysis Report</h1>
            <p>Generated: ${new Date().toLocaleString('en-PH')}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Type</th>
                <th>Submitted By</th>
                <th>Date</th>
                <th>Actions Taken</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${reports.map(r => `
              <tr>
                <td class="code">${r.incident?.incident_code}</td>
                <td>${r.incident?.incident_type?.name}</td>
                <td>${r.submitter?.name}</td>
                <td>${fmt(r.submitted_at)}</td>
                <td>${(r.actions_taken || '').substring(0, 150)}</td>
                <td style="font-weight:700">${r.status}</td>
              </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">
            <p>GAOIRS Management System &bull; Confidential Document</p>
          </div>
        </body>
        </html>`;

        const browser = await puppeteer.launch({
          headless: 'new',
          executablePath,
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
        });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });
        const pdfBuffer = await page.pdf({ format: 'A4', landscape: false, printBackground: true, margin: { top: '5mm', bottom: '5mm', left: '5mm', right: '5mm' } });
        await browser.close();

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="GAOIRS_PostIncident_Report_${timestamp}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        return res.end(pdfBuffer);
      } catch (pErr) {
        console.warn('Puppeteer launch failed, using PDFKit fallback:', pErr.message);
      }
    }

    // Direct PDFKit fallback
    return generatePostReportsPDFKit(reports, res);
  } catch (err) {
    console.error('PDF export error:', err);
    return res.status(500).json({ message: 'Error generating PDF report', error: err.message });
  }
};
