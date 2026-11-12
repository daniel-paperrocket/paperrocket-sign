// paperrocket-sign: dark mode screenshots of the email and certificate snapshots.
//
//   node scripts/paperrocket/render-dark.mjs out/snapshots out/dark
//
// Three views per email, all at 390 px wide:
//   <name>--designed.png  prefers-color-scheme: dark (Apple Mail, iOS Mail, Outlook Mac).
//   <name>--gmail.png     Gmail app forced inversion, simulated: the page is inverted, then images and
//                         [bgcolor] cells are put back (Gmail keeps those), and bare domains turn link blue.
//   <name>--light.png     the normal render, for comparison.
// Certificate pages get <name>--viewer-dark.png (inverted, as a dark PDF viewer shows them).
// This is a simulation, not Gmail itself: check a real draft on a phone before calling it done.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const [inDir, outDir] = [path.resolve(process.argv[2] ?? 'out/snapshots'), path.resolve(process.argv[3] ?? 'out/dark')];
fs.mkdirSync(outDir, { recursive: true });

const WANTED = /^(document-invite|document-completed|reset-password)/;
const GMAIL_CSS = `
html { filter: invert(1) hue-rotate(180deg); background: #fff; }
img, [bgcolor], [background] { filter: invert(1) hue-rotate(180deg); }
`;
const AUTOLINK = `
const domain = /\b((?:[a-z0-9-]+\.)+(?:co\.nz|nz|com|tv|org|net|io))\b/gi;
const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
const nodes = [];
while (walker.nextNode()) nodes.push(walker.currentNode);
for (const n of nodes) {
  if (n.parentElement.closest('a, style, script') || !domain.test(n.nodeValue)) continue;
  domain.lastIndex = 0;
  const span = document.createElement('span');
  span.innerHTML = n.nodeValue.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c])
    .replace(domain, '<u style="color:#1a0dab;text-decoration:underline">$1</u>');
  n.replaceWith(span);
}
`;

const browser = await chromium.launch();
let count = 0;

const shoot = async (file, name, { scheme, gmail }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 800 }, colorScheme: scheme });
  const page = await context.newPage();
  await page.goto(pathToFileURL(file).href);
  await page.waitForLoadState('load');
  if (gmail) {
    await page.evaluate(AUTOLINK);
    await page.addStyleTag({ content: GMAIL_CSS });
  }
  await page.screenshot({ path: path.join(outDir, `${name}.png`), fullPage: true });
  await context.close();
  count++;
};

for (const f of fs.readdirSync(inDir).filter((x) => x.endsWith('.html') && WANTED.test(x)).sort()) {
  const base = f.replace(/\.html$/, '');
  const file = path.join(inDir, f);
  await shoot(file, `${base}--light`, { scheme: 'light' });
  await shoot(file, `${base}--designed`, { scheme: 'dark' });
  await shoot(file, `${base}--gmail`, { scheme: 'light', gmail: true });
}

for (const f of fs.readdirSync(inDir).filter((x) => /-page-\d+\.png$/.test(x)).sort()) {
  const html = path.join(outDir, '_viewer.html');
  fs.writeFileSync(
    html,
    `<body style="margin:0;background:#fff"><img src="${pathToFileURL(path.join(inDir, f)).href}" style="display:block;width:595px;filter:invert(1) hue-rotate(180deg)">`,
  );
  const context = await browser.newContext({ viewport: { width: 595, height: 842 } });
  const page = await context.newPage();
  await page.goto(pathToFileURL(html).href);
  await page.waitForLoadState('load');
  await page.screenshot({ path: path.join(outDir, f.replace(/\.png$/, '--viewer-dark.png')), fullPage: true });
  await context.close();
  count++;
}

fs.rmSync(path.join(outDir, '_viewer.html'), { force: true });
await browser.close();
console.log(`${count} dark mode screenshots in ${outDir}`);
