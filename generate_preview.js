const fs = require('fs');
const path = require('path');
const puppeteer = require('./backend/node_modules/puppeteer');

(async () => {
  const code = fs.readFileSync(path.join(__dirname, 'generate_sitemap_pdf.js'), 'utf8');
  const startIdx = code.indexOf('<!DOCTYPE html>');
  const endIdx = code.indexOf('</html>') + 7;
  const html = code.substring(startIdx, endIdx);

  const tempHtmlPath = path.join(__dirname, 'sitemap_temp.html');
  fs.writeFileSync(tempHtmlPath, html);

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 1650, deviceScaleFactor: 2 });
  await page.goto('file:///' + tempHtmlPath.replace(/\\/g, '/'), { waitUntil: 'networkidle0' });

  const artifactDir = 'C:\\Users\\Tristan Zane\\.gemini\\antigravity\\brain\\5effe06a-83bd-4ae0-aa0a-22f195845690';
  await page.screenshot({ path: path.join(artifactDir, 'sitemap_preview.png'), fullPage: true });

  console.log('Successfully created sitemap_preview.png in artifacts!');
  await browser.close();

  if (fs.existsSync(tempHtmlPath)) {
    fs.unlinkSync(tempHtmlPath);
  }
})();
