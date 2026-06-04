
import puppeteer from 'puppeteer';
import fs from 'fs';

async function testFullPdf() {
  try {
    const commonPaths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    ].filter(Boolean);

    let executablePath = commonPaths.find(p => fs.existsSync(p));
    console.log('Executable:', executablePath);

    const html = `<!DOCTYPE html><html><body><h1>Test</h1></body></html>`;

    const browser = await puppeteer.launch({
      headless: true,
      executablePath,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      landscape: true,
      margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' },
    });
    await browser.close();
    fs.writeFileSync('test_full.pdf', pdfBuffer);
    console.log('Size:', pdfBuffer.length);
  } catch (err) {
    console.error('Error:', err);
  }
}

testFullPdf();
