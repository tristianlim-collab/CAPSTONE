
import puppeteer from 'puppeteer';
import fs from 'fs';

async function testPdf() {
  try {
    const commonPaths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    ].filter(Boolean);

    let executablePath = commonPaths.find(p => fs.existsSync(p));
    console.log('Using executablePath:', executablePath);

    const browser = await puppeteer.launch({
      headless: 'new',
      executablePath,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setContent('<h1>Test PDF</h1>', { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
    });
    await browser.close();
    fs.writeFileSync('test.pdf', pdfBuffer);
    console.log('PDF generated successfully!');
  } catch (err) {
    console.error('PDF generation failed:', err);
  }
}

testPdf();
