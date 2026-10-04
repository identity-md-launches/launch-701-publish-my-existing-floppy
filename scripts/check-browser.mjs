import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

await mkdir('artifacts', { recursive: true });
const root = resolve('dist');
const server = createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (path === '/favicon.ico') { res.writeHead(204).end(); return; }
    if (!path.startsWith('/preview/')) { res.writeHead(404).end(); return; }
    const file = resolve(root, path.slice('/preview/'.length) || 'index.html');
    if (!file.startsWith(root + sep)) { res.writeHead(403).end(); return; }
    const data = await readFile(file);
    res.writeHead(200, { 'Content-Type': { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }[extname(file)] || 'application/octet-stream' });
    res.end(data);
  } catch { res.writeHead(404).end(); }
});
await new Promise((done) => server.listen(0, '127.0.0.1', done));
const url = `http://127.0.0.1:${server.address().port}/preview/`;
let browser;
const errors = [];
const responses = [];
const report = { scope: 'Publication status export only. No game, backend or publishing validation.', viewports: [], errors, responses, screenshots: [] };
function contrast(a, b) {
  const luminance = (color) => {
    const rgb = color.match(/[\d.]+/g).slice(0, 3).map(Number).map((v) => v / 255).map((v) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  };
  const [x, y] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return Number(((x + 0.05) / (y + 0.05)).toFixed(2));
}
try {
  browser = await chromium.launch({ headless: true });
  for (const width of [320, 390, 768, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, hasTouch: width < 500, reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.on('pageerror', (err) => errors.push(String(err)));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('requestfailed', (request) => errors.push(request.url() + ': ' + request.failure().errorText));
    page.on('response', (response) => responses.push({ path: new URL(response.url()).pathname, status: response.status() }));
    await page.goto(url);
    await page.getByRole('heading', { name: 'FLOPPY PEPE', exact: true }).waitFor();
    assert.equal(await page.getByRole('main').count(), 1);
    assert.equal(await page.getByRole('link', { name: 'Open the original reference' }).getAttribute('href'), 'https://floppy-pepe.bikemcanerkoc.chatgpt.site/');
    assert.equal(await page.locator('details').getAttribute('open'), null);
    const fits = () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    assert(await fits(), `Closed disclosure overflow at ${width}`);
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement.tagName), 'A');
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement.tagName), 'SUMMARY');
    const focus = await page.locator('summary').evaluate((el) => ({ width: getComputedStyle(el).outlineWidth, style: getComputedStyle(el).outlineStyle }));
    assert.equal(focus.width, '3px');
    assert.equal(focus.style, 'solid');
    await page.keyboard.press('Enter');
    assert.notEqual(await page.locator('details').getAttribute('open'), null);
    assert(await fits(), `Expanded disclosure overflow at ${width}`);
    assert.equal((await page.locator('.reward').innerText()).replace(/\s+/g, ' '), 'The competition lasts 10 days. The player ranked #1 at the end will receive 5 IMD. The reward will be sent manually by the organizer after the competition ends.');
    const audit = await new AxeBuilder({ page }).analyze();
    assert.equal(audit.violations.length, 0, JSON.stringify(audit.violations));
    const styles = await page.evaluate(() => {
      const read = (selector, property) => getComputedStyle(document.querySelector(selector))[property];
      return { page: read(':root', 'backgroundColor'), surface: read('details', 'backgroundColor'), text: read('main', 'color'), secondary: read('.secondary', 'color'), link: read('a', 'color'), focus: read('summary', 'outlineColor'), h1Size: read('h1', 'fontSize'), h2Size: read('h2', 'fontSize') };
    });
    const measured = { bodyOnPage: contrast(styles.text, styles.page), secondaryOnPage: contrast(styles.secondary, styles.page), linkOnPage: contrast(styles.link, styles.page), textOnSurface: contrast(styles.text, styles.surface), focusOnPage: contrast(styles.focus, styles.page), focusOnSurface: contrast(styles.focus, styles.surface) };
    assert(Object.values(measured).every((value) => value >= 4.5));
    if ([320, 1280].includes(width)) {
      const path = `artifacts/status-${width}.png`;
      await page.screenshot({ path, fullPage: true });
      report.screenshots.push(path);
    }
    await page.keyboard.press('Space');
    assert.equal(await page.locator('details').getAttribute('open'), null);
    if (width < 500) await page.locator('summary').tap();
    else await page.locator('summary').click();
    assert.notEqual(await page.locator('details').getAttribute('open'), null);
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    assert(await fits(), `Text enlargement overflow at ${width}`);
    assert.equal(await page.evaluate(() => localStorage.length), 0);
    report.viewports.push({ width, height: 900, keyboardDisclosure: 'pass', pointerDisclosure: width < 500 ? 'touch pass' : 'click pass', overflow: 'none in collapsed, expanded and 200% text states', axeViolations: audit.violations.length, styles, contrast: measured });
    await context.close();
  }
  assert.equal(errors.length, 0);
  assert(responses.every((response) => response.status < 400));
  const noScript = await browser.newContext({ javaScriptEnabled: false });
  const page = await noScript.newPage();
  await page.goto(url);
  assert(await page.locator('noscript').isVisible());
  assert((await page.locator('noscript').innerText()).includes('publication is blocked'));
  report.noJavaScriptMessage = 'pass';
  await noScript.close();
  report.result = 'pass for status page only';
  await writeFile('artifacts/browser-check.json', JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser?.close();
  await new Promise((done) => server.close(done));
}
