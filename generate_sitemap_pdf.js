const puppeteer = require('./backend/node_modules/puppeteer');
const fs = require('fs');
const path = require('path');

const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>GAOIRS Capstone System Sitemap</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');

    @page {
      size: A4 landscape;
      margin: 0;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Quicksand', 'Inter', system-ui, -apple-system, sans-serif;
      background-color: #f1f3f6;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      width: 100vw;
      padding: 12px;
      -webkit-print-color-adjust: exact;
    }

    .canvas {
      background: #ffffff;
      width: 100%;
      max-width: 1140px;
      padding: 18px 20px 22px 20px;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.06);
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    /* 1. ROOT PILL (Pink/Red Gradient with Soft Glow) */
    .root-node {
      background: linear-gradient(135deg, #ff3b60 0%, #ff2a54 100%);
      color: #ffffff;
      font-weight: 800;
      font-size: 15px;
      padding: 8px 36px;
      border-radius: 28px;
      box-shadow: 0 5px 16px rgba(255, 42, 84, 0.35);
      letter-spacing: 0.5px;
      text-align: center;
      z-index: 10;
    }

    .root-line {
      width: 2px;
      height: 16px;
      background-color: #8c9ba5;
    }

    .horizontal-trunk {
      width: 78%;
      height: 2px;
      background-color: #8c9ba5;
      position: relative;
    }

    /* 4 MAIN COLUMNS GRID */
    .columns-container {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      width: 100%;
      margin-top: 0;
    }

    .column {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .branch-line {
      width: 2px;
      height: 14px;
      background-color: #8c9ba5;
    }

    /* 2. PORTAL PILLS (Orange Gradient) */
    .portal-pill {
      background: linear-gradient(135deg, #ff9432 0%, #ff7b1a 100%);
      color: #ffffff;
      font-weight: 700;
      font-size: 11.5px;
      padding: 6px 14px;
      border-radius: 20px;
      box-shadow: 0 4px 12px rgba(255, 123, 26, 0.3);
      text-align: center;
      width: 92%;
      margin-bottom: 10px;
    }

    /* VERTICAL TREE FLOW IN COLUMNS */
    .tree-flow {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
      position: relative;
    }

    /* MAIN CYAN PILL */
    .cyan-pill {
      background: linear-gradient(135deg, #00c6eb 0%, #00b0e6 100%);
      color: #ffffff;
      font-weight: 700;
      font-size: 10px;
      padding: 5px 10px;
      border-radius: 16px;
      box-shadow: 0 3px 8px rgba(0, 176, 230, 0.25);
      text-align: center;
      width: 90%;
      z-index: 2;
      margin: 2px 0;
    }

    /* CONNECTED SUB-TREE BRANCH */
    .sub-branch-container {
      width: 100%;
      display: flex;
      position: relative;
      margin: 1px 0 4px 0;
    }

    /* Vertical line running down on left side of sub-items */
    .sub-spine {
      position: absolute;
      left: 26%;
      top: -3px;
      bottom: 9px;
      width: 2px;
      background-color: #8c9ba5;
    }

    .sub-items-list {
      display: flex;
      flex-direction: column;
      gap: 3px;
      width: 100%;
      padding-left: 30%;
    }

    .sub-item-row {
      position: relative;
      display: flex;
      align-items: center;
    }

    /* Horizontal connecting line from vertical spine to sub-pill */
    .sub-item-row::before {
      content: "";
      position: absolute;
      left: -13%;
      width: 13%;
      height: 2px;
      background-color: #8c9ba5;
    }

    /* LIGHT BLUE SUB PILL */
    .sub-pill {
      background: #e3f5ff;
      color: #0076a8;
      font-weight: 700;
      font-size: 8.5px;
      padding: 3px 8px;
      border-radius: 12px;
      border: 1px solid #c8ebff;
      white-space: nowrap;
      box-shadow: 0 2px 4px rgba(0, 118, 168, 0.08);
      width: 96%;
      text-align: center;
    }

    /* Direct vertical line connector between cyan pills when no sub-items */
    .direct-connector {
      width: 2px;
      height: 6px;
      background-color: #8c9ba5;
    }
  </style>
</head>
<body>

  <div class="canvas">
    
    <!-- ROOT NODE -->
    <div class="root-node">GAOIRS Capstone System</div>
    <div class="root-line"></div>
    <div class="horizontal-trunk"></div>

    <!-- 4 MAIN BRANCH COLUMNS -->
    <div class="columns-container">
      
      <!-- COLUMN 1: SHARED ROUTES -->
      <div class="column">
        <div class="branch-line"></div>
        <div class="portal-pill">Shared Routes</div>

        <div class="tree-flow">
          <div class="cyan-pill">Home / Login</div>
          <div class="direct-connector"></div>

          <div class="cyan-pill">Register Account</div>
          <div class="direct-connector"></div>

          <div class="cyan-pill">User Profile</div>
          <div class="direct-connector"></div>

          <div class="cyan-pill">Unauthorized Access</div>
        </div>
      </div>

      <!-- COLUMN 2: ADMIN PORTAL (All 10 Admin Pages Included) -->
      <div class="column">
        <div class="branch-line"></div>
        <div class="portal-pill">Admin Portal</div>

        <div class="tree-flow">
          <div class="cyan-pill">Dashboard</div>
          <div class="direct-connector"></div>

          <!-- VERIFICATION QUEUE WITH SUB-ITEMS -->
          <div class="cyan-pill">Verification Queue</div>
          <div class="sub-branch-container">
            <div class="sub-spine"></div>
            <div class="sub-items-list">
              <div class="sub-item-row"><div class="sub-pill">Caller Verify</div></div>
              <div class="sub-item-row"><div class="sub-pill">24h Duplicate Check</div></div>
              <div class="sub-item-row"><div class="sub-pill">Assign Unit</div></div>
            </div>
          </div>

          <div class="cyan-pill">User Management</div>
          <div class="direct-connector"></div>

          <div class="cyan-pill">Response Units</div>
          <div class="direct-connector"></div>

          <div class="cyan-pill">Incident Categories</div>
          <div class="direct-connector"></div>

          <!-- SPATIAL ANALYTICS WITH SUB-ITEMS -->
          <div class="cyan-pill">Spatial Analytics</div>
          <div class="sub-branch-container">
            <div class="sub-spine"></div>
            <div class="sub-items-list">
              <div class="sub-item-row"><div class="sub-pill">KDE Heatmap</div></div>
              <div class="sub-item-row"><div class="sub-pill">Risk Forecast</div></div>
            </div>
          </div>

          <!-- POST INCIDENT REPORTS -->
          <div class="cyan-pill">Post-Incident Reports</div>
          <div class="sub-branch-container">
            <div class="sub-spine"></div>
            <div class="sub-items-list">
              <div class="sub-item-row"><div class="sub-pill">After-Action PDF</div></div>
            </div>
          </div>

          <div class="cyan-pill">Incident Archive</div>
          <div class="direct-connector"></div>

          <div class="cyan-pill">Audit Logs</div>
          <div class="direct-connector"></div>

          <div class="cyan-pill">System Settings</div>
        </div>
      </div>

      <!-- COLUMN 3: RESPONSE UNIT PORTAL -->
      <div class="column">
        <div class="branch-line"></div>
        <div class="portal-pill">Response Unit Portal</div>

        <div class="tree-flow">
          <!-- SHIFT START -->
          <div class="cyan-pill">Shift Initialization</div>
          <div class="sub-branch-container">
            <div class="sub-spine"></div>
            <div class="sub-items-list">
              <div class="sub-item-row"><div class="sub-pill">Duty Toggle (Online)</div></div>
              <div class="sub-item-row"><div class="sub-pill">Readiness Check</div></div>
            </div>
          </div>

          <!-- LIVE MAP -->
          <div class="cyan-pill">Response Live Map</div>
          <div class="sub-branch-container">
            <div class="sub-spine"></div>
            <div class="sub-items-list">
              <div class="sub-item-row"><div class="sub-pill">GIS Navigation</div></div>
              <div class="sub-item-row"><div class="sub-pill">Proximity Alerts</div></div>
            </div>
          </div>

          <!-- ACTIVE DASHBOARD -->
          <div class="cyan-pill">Response Dashboard</div>
          <div class="sub-branch-container">
            <div class="sub-spine"></div>
            <div class="sub-items-list">
              <div class="sub-item-row"><div class="sub-pill">En Route / On Scene</div></div>
              <div class="sub-item-row"><div class="sub-pill">Status Resolve</div></div>
            </div>
          </div>

          <!-- ASSIGNED INCIDENTS -->
          <div class="cyan-pill">Assigned Incidents</div>
          <div class="direct-connector"></div>

          <div class="cyan-pill">Live Notifications</div>
          <div class="direct-connector"></div>

          <div class="cyan-pill">User Guide</div>
        </div>
      </div>

      <!-- COLUMN 4: CITIZEN REPORTER PORTAL -->
      <div class="column">
        <div class="branch-line"></div>
        <div class="portal-pill">Citizen Reporter Portal</div>

        <div class="tree-flow">
          <!-- EMERGENCY HOME -->
          <div class="cyan-pill">Emergency Home</div>
          <div class="sub-branch-container">
            <div class="sub-spine"></div>
            <div class="sub-items-list">
              <div class="sub-item-row"><div class="sub-pill">1-Tap Emergency</div></div>
              <div class="sub-item-row"><div class="sub-pill">Hotline Access</div></div>
            </div>
          </div>

          <!-- INCIDENT REPORT FORM -->
          <div class="cyan-pill">Incident Report Form</div>
          <div class="sub-branch-container">
            <div class="sub-spine"></div>
            <div class="sub-items-list">
              <div class="sub-item-row"><div class="sub-pill">GPS Location Tag</div></div>
              <div class="sub-item-row"><div class="sub-pill">Photo Upload</div></div>
            </div>
          </div>

          <!-- REPORT SUCCESS -->
          <div class="cyan-pill">Report Success</div>
          <div class="sub-branch-container">
            <div class="sub-spine"></div>
            <div class="sub-items-list">
              <div class="sub-item-row"><div class="sub-pill">Reference ID</div></div>
            </div>
          </div>

          <!-- MY REPORTS -->
          <div class="cyan-pill">My Incident Reports</div>
          <div class="sub-branch-container">
            <div class="sub-spine"></div>
            <div class="sub-items-list">
              <div class="sub-item-row"><div class="sub-pill">Status Tracking</div></div>
            </div>
          </div>

          <div class="cyan-pill">Reporter Profile</div>
        </div>
      </div>

    </div>

  </div>

</body>
</html>
`;

async function generatePDF() {
  console.log('Launching browser for PDF generation...');
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

  const pdfPath = path.join(process.cwd(), 'Capstone_System_Sitemap.pdf');

  await page.pdf({
    path: pdfPath,
    format: 'A4',
    landscape: true,
    printBackground: true,
    margin: {
      top: '2mm',
      bottom: '2mm',
      left: '2mm',
      right: '2mm'
    }
  });

  await browser.close();
  console.log('Successfully generated PDF at: ' + pdfPath);
}

generatePDF().catch(err => {
  console.error('Failed to generate PDF:', err);
  process.exit(1);
});
