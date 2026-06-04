import { prisma } from '../config/database.js';
import ExcelJS from 'exceljs';
import puppeteer from 'puppeteer';
import fs from 'fs';

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

    // Look for local Chrome/Edge on Windows as fallback
    const commonPaths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      process.env.PUPPETEER_EXECUTABLE_PATH
    ].filter(Boolean);

    let executablePath = commonPaths.find(p => fs.existsSync(p));

    const browser = await puppeteer.launch({
      headless: true,
      executablePath,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 60000 });
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
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.end(pdfBuffer);
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

    // Build filter
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

    // Transform to flat export rows
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

    // Style header row
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };

    // Add data rows
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

    // Build filter
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
            evidence: true, // Get reporter's photos
          }
        },
        submitter: { select: { name: true, email: true, role: true } },
      },
      orderBy: { submitted_at: 'desc' },
      take: report_id ? 1 : 200,
    });

    if (reports.length === 0) {
      return res.status(404).json({ message: 'No reports found.' });
    }

    const fmt = (d) => d ? new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

    // Build HTML for PDF
    let contentHtml = '';

    if (report_id && reports.length === 1) {
      const r = reports[0];
      contentHtml = `
      <div class="header">
        <h1>Official Post-Incident Report</h1>
        <p>Case Reference: <span class="code">${r.incident?.incident_code}</span></p>
        <p>Generated: ${new Date().toLocaleString('en-PH')}</p>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
        <div style="background: #f8fafc; padding: 10px; border-radius: 6px; border: 1px solid #e2e8f0;">
          <h2 class="section-title">Incident Details</h2>
          <p><strong>Type:</strong> ${r.incident?.incident_type?.name}</p>
          <p><strong>Location:</strong> ${r.incident?.barangay?.name || r.incident?.map_pin_address}</p>
          <p><strong>Reported:</strong> ${fmt(r.incident?.reported_at)}</p>
          <p><strong>Severity:</strong> ${r.incident?.severity}</p>
          <p><strong>Status:</strong> ${r.status}</p>
        </div>
        <div style="background: #f8fafc; padding: 10px; border-radius: 6px; border: 1px solid #e2e8f0;">
          <h2 class="section-title">Response Information</h2>
          <p><strong>Submitted By:</strong> ${r.submitter?.name}</p>
          <p><strong>Time:</strong> ${fmt(r.submitted_at)}</p>
          <p><strong>Response:</strong> ${r.response_time_minutes} minutes</p>
          <p><strong>Casualties:</strong> ${r.casualties || 0}</p>
          <p><strong>Damage Est:</strong> ${r.damages_estimate || 'N/A'}</p>
        </div>
      </div>

      <div style="margin-bottom: 15px;">
        <h2 class="section-title">Actions Taken</h2>
        <div style="background: #fff; border: 1px solid #e2e8f0; padding: 10px; border-radius: 6px; line-height: 1.4; color: #334155;">
          ${r.actions_taken}
        </div>
      </div>

      ${r.remarks ? `
      <div style="margin-bottom: 15px;">
        <h2 class="section-title">Additional Remarks</h2>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 6px; color: #475569;">
          ${r.remarks}
        </div>
      </div>` : ''}

      ${r.admin_notes ? `
      <div style="margin-bottom: 15px;">
        <h2 class="section-title">Admin Acknowledgment</h2>
        <div style="background: #f1f5f9; border: 1px solid #cbd5e1; padding: 10px; border-radius: 6px; color: #1e293b;">
          ${r.admin_notes}
        </div>
      </div>` : ''}

      ${r.incident?.evidence && r.incident.evidence.length > 0 ? `
      <div style="margin-bottom: 15px; page-break-inside: avoid;">
        <h2 class="section-title" style="color: #f43f5e;">Reporter Evidence</h2>
        <div class="photo-grid">
          ${r.incident.evidence.slice(0, 4).map(p => `
            <div class="photo-box"><img src="${p.file_path}" style="width: 100%; height: 100%; object-fit: cover;" /></div>
          `).join('')}
        </div>
      </div>` : ''}

      ${r.photos && r.photos.length > 0 ? `
      <div style="margin-bottom: 15px; page-break-inside: avoid;">
        <h2 class="section-title" style="color: #4f46e5;">Response Evidence</h2>
        <div class="photo-grid">
          ${r.photos.slice(0, 4).map(p => `
            <div class="photo-box"><img src="${p}" style="width: 100%; height: 100%; object-fit: cover;" /></div>
          `).join('')}
        </div>
      </div>` : ''}
      `;
    } else {
      contentHtml = `
      <div class="header">
        <h1>GAOIRS — Post-Incident Analysis Report</h1>
        <p>Generated: ${new Date().toLocaleString('en-PH')}</p>
        ${startDate || endDate ? `<p style="margin-top:4px">Report Period: ${startDate || 'All Time'} to ${endDate || 'Present'}</p>` : ''}
      </div>

      <div class="summary">
        <div class="summary-card"><div class="label">Matched Reports</div><div class="value">${reports.length}</div></div>
        <div class="summary-card"><div class="label">Approved</div><div class="value">${reports.filter(r => r.status === 'APPROVED').length}</div></div>
        <div class="summary-card"><div class="label">AVG Response Time</div><div class="value">${Math.round(reports.reduce((acc, curr) => acc + (curr.response_time_minutes || 0), 0) / (reports.length || 1))}m</div></div>
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
            <td class="actions">${(r.actions_taken || '').substring(0, 150)}${(r.actions_taken || '').length > 150 ? '...' : ''}</td>
            <td style="font-weight:700">${r.status}</td>
          </tr>
          `).join('')}
        </tbody>
      </table>
      `;
    }

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; padding: 25px; font-size: 8.5px; line-height: 1.3; }
        .header { text-align: center; margin-bottom: 12px; border-bottom: 2px solid #4f46e5; padding-bottom: 8px; }
        .header h1 { font-size: 16px; color: #4f46e5; margin-bottom: 2px; }
        .header p { font-size: 9px; color: #64748b; }
        .summary { display: flex; gap: 10px; margin-bottom: 12px; }
        .summary-card { flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 6px; text-align: center; }
        .summary-card .label { font-size: 7px; text-transform: uppercase; color: #94a3b8; font-weight: 700; }
        .summary-card .value { font-size: 14px; font-weight: 900; color: #1e293b; }
        table { width: 100%; border-collapse: collapse; margin-top: 5px; }
        th { background: #4f46e5; color: white; padding: 5px; text-align: left; font-size: 8px; text-transform: uppercase; }
        td { padding: 5px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
        tr:nth-child(even) { background: #f8fafc; }
        .code { font-family: monospace; font-weight: 700; color: #4f46e5; }
        .section-title { font-size: 10px; color: #4f46e5; margin-bottom: 6px; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px; font-weight: 800; }
        .photo-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
        .photo-box { aspect-ratio: 4/3; border-radius: 4px; overflow: hidden; border: 1px solid #e2e8f0; }
        .footer { margin-top: 15px; text-align: center; font-size: 8px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 5px; }
      </style>
    </head>
    <body>
      ${contentHtml}
      <div class="footer">
        <p>GAOIRS Management System &bull; Confidential &bull; Page 1</p>
      </div>
    </body>
    </html>`;

    // Look for local Chrome/Edge on Windows as fallback
    const commonPaths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      process.env.PUPPETEER_EXECUTABLE_PATH
    ].filter(Boolean);

    let executablePath = commonPaths.find(p => fs.existsSync(p));

    const browser = await puppeteer.launch({
      headless: true,
      executablePath,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 60000 });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      landscape: false,
      printBackground: true,
      margin: { top: '5mm', bottom: '5mm', left: '5mm', right: '5mm' },
    });
    await browser.close();

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="GAOIRS_PostIncident_Report_${timestamp}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.end(pdfBuffer);
  } catch (err) {
    console.error('PDF export error:', err);
    return res.status(500).json({ message: 'Error generating PDF report', error: err.message });
  }
};
