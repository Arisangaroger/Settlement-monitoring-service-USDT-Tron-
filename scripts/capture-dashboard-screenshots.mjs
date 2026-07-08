import { mkdir } from 'fs/promises';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = resolve(root, 'docs', 'screenshots');

async function capture(path, filename) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page.goto(`http://localhost:3001${path}`, {
    waitUntil: 'networkidle2',
    timeout: 90_000,
  });
  await page.screenshot({
    path: resolve(outDir, filename),
    fullPage: true,
  });
  await browser.close();
  console.log(`Wrote docs/screenshots/${filename}`);
}

await mkdir(outDir, { recursive: true });
await capture('/', 'dashboard-disconnected.png');
