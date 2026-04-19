import puppeteer from 'puppeteer';
const run = async () => {
try{
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  page.on('console', msg => console.log('LOG:', msg.text()));
  page.on('pageerror', error => console.log('ERROR IS EXACTLY THIS:', error));
  await page.goto('http://localhost:5173/response/map');
  await new Promise(r => setTimeout(r, 4000));
  await browser.close();
} catch(e) { console.error('PUPPETEER EXCEPTION', e) }
};
run();
