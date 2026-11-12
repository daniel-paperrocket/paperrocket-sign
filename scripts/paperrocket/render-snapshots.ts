/**
 * paperrocket-sign: renders every email template to HTML with made-up NZ fixtures.
 *
 *   npx tsx scripts/paperrocket/render-snapshots.ts out/snapshots
 *
 * Writes <out>/<template>--<branding>.html (and .txt), <out>/logos/*.png and <out>/index.html.
 * Then, if scripts/paperrocket/render-certificate-snapshot.ts exists, calls its default export with <out>.
 */
import { Canvas } from '@documenso/skia-canvas';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createElement } from 'react';

import { getButtonColours } from '../../packages/email/paperrocket/colour';
import type { EmailLogoMeta } from '../../packages/email/paperrocket/logo';
import { getLogoSize } from '../../packages/email/paperrocket/logo';
import type { BrandingSettings } from '../../packages/email/providers/branding';
import { analyseEmailLogo, renderEmailLogoVariant } from '../../packages/lib/server-only/paperrocket/email-logo-image';
import { renderEmailWithI18N } from '../../packages/lib/utils/render-email-with-i18n';

const outDir = path.resolve(process.argv[2] ?? 'out/snapshots');
const templatesDir = path.resolve(__dirname, '../../packages/email/templates');

type Fixture = { label: string; primary: string; branding: BrandingSettings };

const baseBranding = {
  brandingEnabled: true,
  brandingUrl: 'https://harbourjoinery.example.co.nz',
  brandingHidePoweredBy: true,
  brandingName: 'Harbour Joinery',
  brandingCompanyDetails: 'Harbour Joinery Ltd\n14 Lakeview Terrace, Wānaka 9305\n03 555 0142',
};

type LogoName = 'wordmark' | 'tile' | 'stacked';

const makeLogoPng = async (name: LogoName): Promise<Buffer> => {
  const sizes: Record<LogoName, [number, number]> = { wordmark: [720, 140], tile: [400, 400], stacked: [420, 300] };
  const [w, h] = sizes[name];
  const canvas = new Canvas(w, h);
  canvas.gpu = false;
  const ctx = canvas.getContext('2d');

  if (name === 'wordmark') {
    ctx.fillStyle = '#1F3A5F';
    ctx.font = '700 88px sans-serif';
    ctx.fillText('Harbour Joinery', 10, 100);
  } else if (name === 'tile') {
    ctx.fillStyle = '#0F6B5C';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 220px sans-serif';
    ctx.fillText('HJ', 70, 270);
  } else {
    ctx.fillStyle = '#D9482B';
    ctx.beginPath();
    ctx.arc(210, 90, 70, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2E7D32';
    ctx.fillRect(150, 120, 120, 40);
    ctx.fillStyle = '#1F3A5F';
    ctx.font = '700 64px sans-serif';
    ctx.fillText('Harbour', 90, 250);
  }

  return Buffer.from(await canvas.toBuffer('png'));
};

const buildLogoFixture = async (name: LogoName): Promise<EmailLogoMeta> => {
  const png = await makeLogoPng(name);
  const analysis = await analyseEmailLogo(png);
  const size = getLogoSize(analysis);
  fs.mkdirSync(path.join(outDir, 'logos'), { recursive: true });

  for (const variant of ['plate', 'dark'] as const) {
    const image = await renderEmailLogoVariant(png, analysis, variant, size);
    fs.writeFileSync(path.join(outDir, 'logos', `${name}-${variant}.png`), image);
  }

  return {
    width: analysis.width,
    height: analysis.height,
    kind: analysis.kind,
    urlTemplate: `logos/${name}-{variant}.png`,
  };
};

// Extra prop sets for templates with real variants. Everything else renders on its defaults.
const EXTRA_PROPS: Record<string, Record<string, unknown>[]> = {
  'document-invite': [
    { role: 'SIGNER' },
    { role: 'VIEWER' },
    { role: 'APPROVER' },
    { role: 'SIGNER', customBody: 'Kia ora Sam, could you sign by Friday please?' },
  ],
};

const main = async () => {
  fs.mkdirSync(outDir, { recursive: true });

  const wordmark = await buildLogoFixture('wordmark');
  const tile = await buildLogoFixture('tile');
  const stacked = await buildLogoFixture('stacked');

  const make = (label: string, primary: string, logo: EmailLogoMeta | null): Fixture => ({
    label,
    primary,
    branding: {
      ...baseBranding,
      brandingLogo: logo ? 'fixture' : '',
      brandingLogoMeta: logo ?? undefined,
      brandingColors: { primary } as never,
    },
  });

  const fixtures: Fixture[] = [
    make('wordmark', '#1F3A5F', wordmark),
    make('tile', '#0F6B5C', tile),
    make('stacked-pale', '#F2C94C', stacked),
    make('no-logo', '#B4531E', null),
  ];

  const files = fs
    .readdirSync(templatesDir)
    .filter((f) => f.endsWith('.tsx'))
    .sort();
  const written: string[] = [];
  let failures = 0;

  for (const file of files) {
    const name = file.replace(/\.tsx$/, '');
    const mod = await import(path.join(templatesDir, file));
    const Component = mod.default;

    if (typeof Component !== 'function') {
      console.error(`FAIL ${name}: no default export`);
      failures++;
      continue;
    }

    const propSets = EXTRA_PROPS[name] ?? [{}];

    for (let p = 0; p < propSets.length; p++) {
      for (const fixture of fixtures) {
        // Extra prop sets only render with the first branding, to keep the index readable.
        if (p > 0 && fixture.label !== 'wordmark') {
          continue;
        }

        const out = `${name}${p > 0 ? `-v${p}` : ''}--${fixture.label}`;

        try {
          const element = createElement(Component, propSets[p] as never);
          const html = await renderEmailWithI18N(element, { branding: fixture.branding });

          if (!html.includes('prefers-color-scheme')) {
            throw new Error('rendered HTML lost the dark mode style block');
          }

          const text = await renderEmailWithI18N(element, { branding: fixture.branding, plainText: true });

          if (!text.trim()) {
            throw new Error('plain text is empty');
          }

          fs.writeFileSync(path.join(outDir, `${out}.html`), html);
          fs.writeFileSync(path.join(outDir, `${out}.txt`), text);
          written.push(out);
        } catch (err) {
          failures++;
          console.error(`FAIL ${out}:`, err);
        }
      }
    }
  }

  for (const f of fixtures) {
    const { fill, text } = getButtonColours(f.primary);
    console.log(`button ${f.label}: fill ${fill} text ${text}`);
  }

  const items = written.map((n) => `<li><a href="${n}.html">${n}</a> (<a href="${n}.txt">text</a>)</li>`).join('\n');
  fs.writeFileSync(
    path.join(outDir, 'index.html'),
    `<!doctype html><meta charset="utf-8"><title>Email snapshots</title>
<body style="font-family:system-ui;max-width:900px;margin:24px auto;padding:0 16px">
<h1>Email snapshots</h1>
<ul>${items}</ul></body>`,
  );

  const certScript = path.resolve(__dirname, 'render-certificate-snapshot.ts');

  if (fs.existsSync(certScript)) {
    const cert = await import(certScript);
    await cert.default(outDir);
  }

  console.log(`${written.length} snapshots written to ${outDir}, ${failures} failures`);

  if (failures > 0) {
    process.exit(1);
  }
};

await main();
