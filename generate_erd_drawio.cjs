const fs = require('fs');
const path = require('path');

// Helper to escape XML text
function xmlEscape(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function generateErdDrawIoXml() {
  let idCounter = 2;
  const getId = () => `erd_${idCounter++}`;

  let xmlCells = [];

  // Base cells
  xmlCells.push(`<mxCell id="0" />`);
  xmlCells.push(`<mxCell id="1" parent="0" />`);

  // Define database tables and their fields based on schema.prisma
  const tables = [
    {
      name: "USER",
      x: 350, y: 40, w: 220,
      fields: [
        { name: "user_id", type: "String", pk: true },
        { name: "name", type: "String" },
        { name: "email", type: "String", uk: true },
        { name: "password_hash", type: "String" },
        { name: "contact_number", type: "String?" },
        { name: "role", type: "Role" },
        { name: "barangay_id", type: "String?", fk: true },
        { name: "unit_id", type: "String?", fk: true },
        { name: "is_active", type: "Boolean" },
        { name: "created_at", type: "DateTime" }
      ]
    },
    {
      name: "BARANGAYS",
      x: 40, y: 40, w: 220,
      fields: [
        { name: "barangay_id", type: "String", pk: true },
        { name: "name", type: "String" },
        { name: "municipality", type: "String" },
        { name: "city", type: "String?" },
        { name: "boundary_geojson", type: "Json" },
        { name: "created_at", type: "DateTime" }
      ]
    },
    {
      name: "RESPONSE_UNIT",
      x: 680, y: 40, w: 220,
      fields: [
        { name: "unit_id", type: "String", pk: true },
        { name: "unit_name", type: "String" },
        { name: "unit_type", type: "UnitType" },
        { name: "contact_number", type: "String?" },
        { name: "latitude", type: "Float?" },
        { name: "longitude", type: "Float?" },
        { name: "barangay_id", type: "String?", fk: true },
        { name: "availability_status", type: "UnitStatus" },
        { name: "last_updated", type: "DateTime" }
      ]
    },
    {
      name: "INCIDENT_TYPES",
      x: 40, y: 340, w: 220,
      fields: [
        { name: "type_id", type: "String", pk: true },
        { name: "name", type: "String" },
        { name: "color_code", type: "String" },
        { name: "icon_label", type: "String" },
        { name: "description", type: "String?" },
        { name: "default_unit_type", type: "UnitType" }
      ]
    },
    {
      name: "INCIDENT",
      x: 350, y: 340, w: 240,
      fields: [
        { name: "incident_id", type: "String", pk: true },
        { name: "incident_code", type: "String", uk: true },
        { name: "reported_by", type: "String?", fk: true },
        { name: "incident_type_id", type: "String", fk: true },
        { name: "barangay_id", type: "String?", fk: true },
        { name: "description", type: "String" },
        { name: "latitude", type: "Float" },
        { name: "longitude", type: "Float" },
        { name: "map_pin_address", type: "String?" },
        { name: "status", type: "IncidentStatus" },
        { name: "severity", type: "Severity" },
        { name: "priority", type: "Priority" },
        { name: "reported_at", type: "DateTime" },
        { name: "updated_at", type: "DateTime" }
      ]
    },
    {
      name: "INCIDENT_ASSIGNMENTS",
      x: 680, y: 340, w: 240,
      fields: [
        { name: "assignment_id", type: "String", pk: true },
        { name: "incident_id", type: "String", fk: true },
        { name: "unit_id", type: "String", fk: true },
        { name: "assigned_by", type: "String", fk: true },
        { name: "status", type: "AssignmentStatus" },
        { name: "assigned_at", type: "DateTime" },
        { name: "acknowledged_at", type: "DateTime?" },
        { name: "arrived_at", type: "DateTime?" },
        { name: "resolved_at", type: "DateTime?" },
        { name: "updated_at", type: "DateTime" }
      ]
    },
    {
      name: "EVIDENCE",
      x: 40, y: 680, w: 220,
      fields: [
        { name: "evidence_id", type: "String", pk: true },
        { name: "incident_id", type: "String", fk: true },
        { name: "uploaded_by", type: "String?", fk: true },
        { name: "file_path", type: "String" },
        { name: "file_type", type: "String" },
        { name: "uploaded_at", type: "DateTime" }
      ]
    },
    {
      name: "POST_INCIDENT_REPORTS",
      x: 350, y: 780, w: 250,
      fields: [
        { name: "report_id", type: "String", pk: true },
        { name: "incident_id", type: "String", fk: true, uk: true },
        { name: "submitted_by", type: "String", fk: true },
        { name: "response_time_minutes", type: "Int?" },
        { name: "actions_taken", type: "String" },
        { name: "casualties", type: "Int" },
        { name: "damages_estimate", type: "String?" },
        { name: "status", type: "ReportStatus" },
        { name: "submitted_at", type: "DateTime" }
      ]
    },
    {
      name: "INCIDENT_STATUS_LOG",
      x: 680, y: 680, w: 240,
      fields: [
        { name: "log_id", type: "String", pk: true },
        { name: "incident_id", type: "String", fk: true },
        { name: "changed_by", type: "String", fk: true },
        { name: "status", type: "IncidentStatus" },
        { name: "remarks", type: "String?" },
        { name: "changed_at", type: "DateTime" }
      ]
    },
    {
      name: "NOTIFICATIONS",
      x: 980, y: 340, w: 230,
      fields: [
        { name: "notification_id", type: "String", pk: true },
        { name: "incident_id", type: "String", fk: true },
        { name: "unit_id", type: "String?", fk: true },
        { name: "assigned_by", type: "String?", fk: true },
        { name: "channel", type: "AlertChannel" },
        { name: "message_body", type: "String" },
        { name: "delivery_status", type: "DeliveryStatus" },
        { name: "sent_at", type: "DateTime" }
      ]
    },
    {
      name: "GENERATED_REPORTS",
      x: 980, y: 40, w: 230,
      fields: [
        { name: "report_id", type: "String", pk: true },
        { name: "generated_by", type: "String", fk: true },
        { name: "report_title", type: "String" },
        { name: "report_type", type: "ReportType" },
        { name: "file_format", type: "FileFormat" },
        { name: "file_path", type: "String" },
        { name: "generated_at", type: "DateTime" }
      ]
    },
    {
      name: "SYSTEM_AUDIT_LOGS",
      x: 980, y: 680, w: 230,
      fields: [
        { name: "log_id", type: "String", pk: true },
        { name: "user_id", type: "String", fk: true },
        { name: "action", type: "String" },
        { name: "resource", type: "String" },
        { name: "created_at", type: "DateTime" }
      ]
    }
  ];

  const tableNodeMap = {};

  // Build Table Nodes
  tables.forEach(table => {
    const tableId = getId();
    tableNodeMap[table.name] = tableId;

    const rowHeight = 26;
    const headerHeight = 35;
    const totalHeight = headerHeight + (table.fields.length * rowHeight);

    // Table Container / Header
    xmlCells.push(`
      <mxCell id="${tableId}" value="${xmlEscape(table.name)}" style="swipe;html=1;whiteSpace=wrap;fillColor=#1e293b;fontColor=#ffffff;fontStyle=1;fontSize=14;align=center;verticalAlign=top;spacingTop=8;strokeColor=#0f172a;rounded=1;arcSize=8;shadow=1;" vertex="1" parent="1">
        <mxGeometry x="${table.x}" y="${table.y}" width="${table.w}" height="${totalHeight}" as="geometry" />
      </mxCell>
    `);

    // Fields inside Table
    table.fields.forEach((field, idx) => {
      const fieldId = getId();
      const fieldY = headerHeight + (idx * rowHeight);
      
      let prefix = "  ";
      if (field.pk) prefix = "PK ";
      else if (field.fk) prefix = "FK ";
      else if (field.uk) prefix = "UK ";

      const label = `${prefix}${field.name} : ${field.type}`;
      
      let bgStyle = (idx % 2 === 0) ? "fillColor=#f8fafc;" : "fillColor=#ffffff;";
      if (field.pk) bgStyle += "fontStyle=1;fontColor=#0f172a;";
      else if (field.fk) bgStyle += "fontStyle=2;fontColor=#334155;";

      xmlCells.push(`
        <mxCell id="${fieldId}" value="${xmlEscape(label)}" style="text;strokeColor=none;html=1;whiteSpace=wrap;verticalAlign=middle;fontSize=11;spacingLeft=8;${bgStyle}" vertex="1" parent="${tableId}">
          <mxGeometry x="0" y="${fieldY}" width="${table.w}" height="${rowHeight}" as="geometry" />
        </mxCell>
      `);
    });
  });

  // Relationships (Edges)
  const relationships = [
    { from: "USER", to: "INCIDENT", label: "1:N (reported_by)" },
    { from: "USER", to: "INCIDENT_ASSIGNMENTS", label: "1:N (assigned_by)" },
    { from: "USER", to: "INCIDENT_STATUS_LOG", label: "1:N (changed_by)" },
    { from: "USER", to: "EVIDENCE", label: "1:N (uploaded_by)" },
    { from: "USER", to: "POST_INCIDENT_REPORTS", label: "1:N (reviewed_by/submits)" },
    { from: "USER", to: "NOTIFICATIONS", label: "1:N (assigned_to)" },
    { from: "USER", to: "GENERATED_REPORTS", label: "1:N (generated_by)" },
    { from: "USER", to: "SYSTEM_AUDIT_LOGS", label: "1:N (user_id)" },

    { from: "BARANGAYS", to: "USER", label: "1:N (barangay_id)" },
    { from: "BARANGAYS", to: "INCIDENT", label: "1:N (barangay_id)" },
    { from: "BARANGAYS", to: "RESPONSE_UNIT", label: "1:N (barangay_id)" },

    { from: "RESPONSE_UNIT", to: "USER", label: "1:N (unit_id)" },
    { from: "RESPONSE_UNIT", to: "INCIDENT_ASSIGNMENTS", label: "1:N (unit_id)" },

    { from: "INCIDENT_TYPES", to: "INCIDENT", label: "1:N (incident_type_id)" },

    { from: "INCIDENT", to: "INCIDENT_ASSIGNMENTS", label: "1:N (incident_id)" },
    { from: "INCIDENT", to: "INCIDENT_STATUS_LOG", label: "1:N (incident_id)" },
    { from: "INCIDENT", to: "EVIDENCE", label: "1:N (incident_id)" },
    { from: "INCIDENT", to: "POST_INCIDENT_REPORTS", label: "1:1 (incident_id)" },
    { from: "INCIDENT", to: "NOTIFICATIONS", label: "1:N (incident_id)" }
  ];

  relationships.forEach(rel => {
    const sourceId = tableNodeMap[rel.from];
    const targetId = tableNodeMap[rel.to];

    if (sourceId && targetId) {
      const edgeId = getId();
      xmlCells.push(`
        <mxCell id="${edgeId}" value="${xmlEscape(rel.label)}" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;fontSize=10;fontColor=#475569;strokeColor=#64748b;strokeWidth=1.5;endArrow=ERzeroToMany;startArrow=ERone;" edge="1" parent="1" source="${sourceId}" target="${targetId}">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
      `);
    }
  });

  const fullXml = `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net" modified="${new Date().toISOString()}" agent="Antigravity" version="21.0.0" type="device">
  <diagram id="GAOIRS_ERD" name="GAOIRS Database ERD">
    <mxGraphModel dx="1600" dy="1200" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1400" pageHeight="1100" background="#ffffff">
      <root>
        ${xmlCells.join('\n')}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;

  const outputPath = path.join(process.cwd(), 'GAOIRS_DATABASE_ERD.drawio');
  fs.writeFileSync(outputPath, fullXml, 'utf8');
  console.log('Successfully generated editable draw.io ERD file at: ' + outputPath);
}

generateErdDrawIoXml();
