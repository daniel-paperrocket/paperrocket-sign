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
img, .pr-keep { filter: invert(1) hue-rotate(180deg); }
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

// Gmail darkens light fills and leaves mid-tone and dark ones (brand panels, buttons) as authored.
const KEEP = `
const lum = (c) => { const m = c.match(/[0-9.]+/g).map(Number); if (m.length > 3 && m[3] === 0) return null;
  const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(m[0]) + 0.7152 * f(m[1]) + 0.0722 * f(m[2]); };
for (const el of document.querySelectorAll('body *')) {
  const l = lum(getComputedStyle(el).backgroundColor);
  if (l !== null && l < 0.3 && !el.closest('.pr-keep')) el.classList.add('pr-keep');
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
    await page.evaluate(KEEP);
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
