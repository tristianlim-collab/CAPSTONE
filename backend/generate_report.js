import fs from 'fs';

const report = JSON.parse(fs.readFileSync('test-report.json', 'utf8'));

const totalSuites = report.numTotalTestSuites;
const totalCases = report.numTotalTests;
const passed = report.numPassedTests;
const failed = report.numFailedTests;
const duration = (report.testResults.reduce((acc, r) => acc + (r.endTime - r.startTime), 0) / 1000).toFixed(3);
const passRate = ((passed / totalCases) * 100).toFixed(1) + '%';

const html = `<!DOCTYPE html>
<html>
<head>
  <title>GAOIRS Jest White Box Testing Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 40px; background: #f4f6f8; color: #2d3748; }
    .card { background: white; padding: 35px; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); max-width: 650px; margin: 0 auto; border: 1px solid #e2e8f0; }
    h2 { margin-top: 0; color: #1a202c; font-size: 22px; margin-bottom: 20px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
    p { margin: 8px 0; font-size: 15px; color: #4a5568; }
    .bold { font-weight: 700; color: #1a202c; }
    h3 { margin-top: 25px; margin-bottom: 12px; color: #2d3748; font-size: 18px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; border-radius: 6px; overflow: hidden; }
    th, td { border: 1px solid #e2e8f0; padding: 12px 16px; text-align: left; font-size: 15px; }
    th { background: #edf2f7; font-weight: 700; color: #2d3748; }
    tr:nth-child(even) { background: #f7fafc; }
    .badge-pass { background: #C6F6D5; color: #22543D; padding: 4px 10px; border-radius: 6px; font-weight: 700; display: inline-block; }
  </style>
</head>
<body>
  <div class="card">
    <h2>GAOIRS Jest White Box Testing Report</h2>
    <p><span class="bold">System:</span> Geospatial Analytics & Incident Response System</p>
    <p><span class="bold">Subsystem:</span> Backend Core API, Security, Storage & Dispatch Services</p>
    <p><span class="bold">Testing Type:</span> White Box Testing (Automated)</p>
    <p><span class="bold">Testing Tool:</span> Jest with Node.js ESM</p>
    <p><span class="bold">Tester:</span> GAOIRS Capstone Development Team</p>
    <p><span class="bold">Date:</span> September 6, 2026</p>
    <p><span class="bold">Environment:</span> Local Development (localhost:3001)</p>
    <p><span class="bold">Database:</span> Supabase PostgreSQL (Project: rkiexbxkicykuxykgznp)</p>
    <p><span class="bold">Total Duration:</span> ${duration} seconds</p>

    <h3>Executive Summary</h3>
    <table>
      <thead>
        <tr><th>Metric</th><th>Value</th></tr>
      </thead>
      <tbody>
        <tr><td>Total Test Suites</td><td>${totalSuites}</td></tr>
        <tr><td>Total Test Cases</td><td>${totalCases}</td></tr>
        <tr><td>Tests Passed</td><td><span class="badge-pass">${passed}</span></td></tr>
        <tr><td>Tests Failed</td><td>${failed}</td></tr>
        <tr><td>Snapshots</td><td>0</td></tr>
        <tr><td>Pass Rate</td><td><span class="bold">${passRate}</span></td></tr>
        <tr><td>Total Duration</td><td>${duration}s</td></tr>
      </tbody>
    </table>
  </div>
</body>
</html>`;

fs.writeFileSync('public-report.html', html);
console.log('Executive Summary Report successfully saved as public-report.html');
