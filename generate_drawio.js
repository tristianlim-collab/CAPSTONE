const fs = require('fs');
const path = require('path');

// Helper to escape XML text
function xmlEscape(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function generateDrawIoXml() {
  const rootId = "0";
  const parentId = "1";
  let idCounter = 2;
  const getId = () => `node_${idCounter++}`;

  let xmlCells = [];

  // Base cells
  xmlCells.push(`<mxCell id="0" />`);
  xmlCells.push(`<mxCell id="1" parent="0" />`);

  // Top Root Pill
  const rootPillId = getId();
  xmlCells.push(`
    <mxCell id="${rootPillId}" value="GAOIRS Capstone System" style="html=1;whiteSpace=wrap;strokeColor=none;fillColor=#ff3b60;fontColor=#ffffff;fontStyle=1;fontSize=15;rounded=1;arcSize=50;shadow=1;" vertex="1" parent="1">
      <mxGeometry x="460" y="30" width="240" height="42" as="geometry" />
    </mxCell>
  `);

  // Vertical line from root pill to trunk
  const vLineId = getId();
  xmlCells.push(`
    <mxCell id="${vLineId}" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthoHorig=0;exitX=0.5;exitY=1;entryX=0.5;entryY=0;strokeColor=#8c9ba5;strokeWidth=2;endArrow=none;" edge="1" parent="1" source="${rootPillId}">
      <mxGeometry relative="1" as="geometry">
        <mxPoint x="580" y="100" as="targetPoint" />
      </mxGeometry>
    </mxCell>
  `);

  // Horizontal Trunk Line
  const trunkLineId = getId();
  xmlCells.push(`
    <mxCell id="${trunkLineId}" value="" style="endArrow=none;html=1;strokeColor=#8c9ba5;strokeWidth=2;" edge="1" parent="1">
      <mxGeometry width="50" height="50" relative="1" as="geometry">
        <mxPoint x="140" y="100" as="sourcePoint" />
        <mxPoint x="1040" y="100" as="targetPoint" />
      </mxGeometry>
    </mxCell>
  `);

  // Columns definition
  const columns = [
    {
      title: "Shared Routes",
      x: 140,
      items: [
        { type: "cyan", text: "Home / Login" },
        { type: "cyan", text: "Register Account" },
        { type: "cyan", text: "User Profile" },
        { type: "cyan", text: "Unauthorized Access" }
      ]
    },
    {
      title: "Admin Portal",
      x: 440,
      items: [
        { type: "cyan", text: "Dashboard" },
        { 
          type: "cyan", text: "Verification Queue", 
          subs: ["Caller Verify", "24h Duplicate Check", "Assign Unit"] 
        },
        { type: "cyan", text: "User Management" },
        { type: "cyan", text: "Response Units" },
        { type: "cyan", text: "Incident Categories" },
        { 
          type: "cyan", text: "Spatial Analytics",
          subs: ["KDE Heatmap", "Risk Forecast"]
        },
        { 
          type: "cyan", text: "Post-Incident Reports",
          subs: ["After-Action PDF"]
        },
        { type: "cyan", text: "Incident Archive" },
        { type: "cyan", text: "Audit Logs" },
        { type: "cyan", text: "System Settings" }
      ]
    },
    {
      title: "Response Unit Portal",
      x: 740,
      items: [
        { 
          type: "cyan", text: "Shift Initialization",
          subs: ["Duty Toggle (Online)", "Readiness Check"]
        },
        { 
          type: "cyan", text: "Response Live Map",
          subs: ["GIS Navigation", "Proximity Alerts"]
        },
        { 
          type: "cyan", text: "Response Dashboard",
          subs: ["En Route / On Scene", "Status Resolve"]
        },
        { type: "cyan", text: "Assigned Incidents" },
        { type: "cyan", text: "Live Notifications" },
        { type: "cyan", text: "User Guide" }
      ]
    },
    {
      title: "Citizen Reporter Portal",
      x: 1040,
      items: [
        { 
          type: "cyan", text: "Emergency Home",
          subs: ["1-Tap Emergency", "Hotline Access"]
        },
        { 
          type: "cyan", text: "Incident Report Form",
          subs: ["GPS Location Tag", "Photo Upload"]
        },
        { 
          type: "cyan", text: "Report Success",
          subs: ["Reference ID"]
        },
        { 
          type: "cyan", text: "My Incident Reports",
          subs: ["Status Tracking"]
        },
        { type: "cyan", text: "Reporter Profile" }
      ]
    }
  ];

  columns.forEach(col => {
    const colCenterX = col.x;
    
    // Line down from trunk to Portal Pill
    const branchLineId = getId();
    xmlCells.push(`
      <mxCell id="${branchLineId}" value="" style="endArrow=none;html=1;strokeColor=#8c9ba5;strokeWidth=2;" edge="1" parent="1">
        <mxGeometry width="50" height="50" relative="1" as="geometry">
          <mxPoint x="${colCenterX}" y="100" as="sourcePoint" />
          <mxPoint x="${colCenterX}" y="125" as="targetPoint" />
        </mxGeometry>
      </mxCell>
    `);

    // Portal Pill
    const portalId = getId();
    const portalW = 210;
    const portalX = colCenterX - portalW / 2;
    xmlCells.push(`
      <mxCell id="${portalId}" value="${xmlEscape(col.title)}" style="html=1;whiteSpace=wrap;strokeColor=none;fillColor=#ff8c2b;fontColor=#ffffff;fontStyle=1;fontSize=12;rounded=1;arcSize=50;shadow=1;" vertex="1" parent="1">
        <mxGeometry x="${portalX}" y="125" width="${portalW}" height="36" as="geometry" />
      </mxCell>
    `);

    let currentY = 175;
    let lastParentNodeId = portalId;

    col.items.forEach(item => {
      // Cyan pill
      const cyanId = getId();
      const cyanW = 190;
      const cyanX = colCenterX - cyanW / 2;
      xmlCells.push(`
        <mxCell id="${cyanId}" value="${xmlEscape(item.text)}" style="html=1;whiteSpace=wrap;strokeColor=none;fillColor=#00c6eb;fontColor=#ffffff;fontStyle=1;fontSize=10;rounded=1;arcSize=50;shadow=1;" vertex="1" parent="1">
          <mxGeometry x="${cyanX}" y="${currentY}" width="${cyanW}" height="30" as="geometry" />
        </mxCell>
      `);

      // Connect from last node
      const connectorId = getId();
      xmlCells.push(`
        <mxCell id="${connectorId}" value="" style="endArrow=none;html=1;strokeColor=#8c9ba5;strokeWidth=1.5;" edge="1" parent="1" source="${lastParentNodeId}" target="${cyanId}">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
      `);

      currentY += 34;
      lastParentNodeId = cyanId;

      // Sub items if any
      if (item.subs && item.subs.length > 0) {
        const spineX = colCenterX - 35;
        const startSpineY = currentY - 4;

        item.subs.forEach(subText => {
          const subId = getId();
          const subW = 120;
          const subX = spineX + 15;
          const subY = currentY;

          xmlCells.push(`
            <mxCell id="${subId}" value="${xmlEscape(subText)}" style="html=1;whiteSpace=wrap;strokeColor=#c8ebff;fillColor=#e3f5ff;fontColor=#0076a8;fontStyle=1;fontSize=8.5;rounded=1;arcSize=50;" vertex="1" parent="1">
              <mxGeometry x="${subX}" y="${subY}" width="${subW}" height="22" as="geometry" />
            </mxCell>
          `);

          // Horizontal tick line from spine to sub pill
          const tickId = getId();
          xmlCells.push(`
            <mxCell id="${tickId}" value="" style="endArrow=none;html=1;strokeColor=#8c9ba5;strokeWidth=1.5;" edge="1" parent="1">
              <mxGeometry width="50" height="50" relative="1" as="geometry">
                <mxPoint x="${spineX}" y="${subY + 11}" as="sourcePoint" />
                <mxPoint x="${subX}" y="${subY + 11}" as="targetPoint" />
              </mxGeometry>
            </mxCell>
          `);

          currentY += 26;
        });

        const endSpineY = currentY - 15;
        // Vertical spine line
        const spineLineId = getId();
        xmlCells.push(`
          <mxCell id="${spineLineId}" value="" style="endArrow=none;html=1;strokeColor=#8c9ba5;strokeWidth=1.5;" edge="1" parent="1">
            <mxGeometry width="50" height="50" relative="1" as="geometry">
              <mxPoint x="${spineX}" y="${startSpineY}" as="sourcePoint" />
              <mxPoint x="${spineX}" y="${endSpineY}" as="targetPoint" />
            </mxGeometry>
          </mxCell>
        `);
      }
    });
  });

  const fullXml = `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net" modified="${new Date().toISOString()}" agent="Antigravity" version="21.0.0" type="device">
  <diagram id="GAOIRS_Sitemap" name="GAOIRS Capstone Sitemap">
    <mxGraphModel dx="1200" dy="900" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1169" pageHeight="827" background="#ffffff">
      <root>
        ${xmlCells.join('\n')}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;

  const outputPath = path.join(process.cwd(), 'Capstone_System_Sitemap.drawio');
  fs.writeFileSync(outputPath, fullXml, 'utf8');
  console.log('Successfully generated draw.io file at: ' + outputPath);
}

generateDrawIoXml();
