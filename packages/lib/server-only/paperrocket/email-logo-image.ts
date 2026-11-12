import type { EmailLogoKind, EmailLogoVariant, LogoSize } from '@documenso/email/paperrocket/logo';
import { PLATE_PADDING_X, PLATE_PADDING_Y, PLATE_RADIUS } from '@documenso/email/paperrocket/logo';
import { Canvas, loadImage } from '@documenso/skia-canvas';

/**
 * Letterhead logo images for email (DESIGN.md "Logo on dark", "Compatibility rules").
 *
 * `plate`: PNG with a white rounded plate baked in, so Gmail's forced dark mode shows a deliberate white chip.
 * `dark`: a white version of a one-colour logo, for Apple Mail and iOS Mail dark mode.
 * Both are drawn at 2x.
 */

const SCALE = 2;
const ANALYSIS_MAX_SIDE = 96;

/** Chroma below this counts as grey or black rather than a hue. */
const NEUTRAL_CHROMA = 0.12;

/** Mean resultant length of the hue angles; 1 is one hue, 0 is evenly spread. */
const SINGLE_HUE_CONCENTRATION = 0.95;

const DARK_FILL = 242;

export type EmailLogoAnalysis = {
  width: number;
  height: number;
  kind: EmailLogoKind;
  /** True when the logo sits on transparency (the ink is the colour); false when it has an opaque background. */
  hasTransparency: boolean;
};

const getLuminance = (r: number, g: number, b: number) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

const createCanvas = (width: number, height: number) => {
  const canvas = new Canvas(width, height);
  canvas.gpu = false;

  return canvas;
};

/**
 * Works out the logo's natural size and how it should behave on dark.
 *
 * One-colour means the visible ink is all grey/black, or all within a narrow band of one hue.
 * Anything else keeps its plate on dark. A logo that fills its whole frame with a non-white colour is a tile.
 */
export const analyseEmailLogo = async (input: Uint8Array): Promise<EmailLogoAnalysis> => {
  const image = await loadImage(Buffer.from(input));
  const width = Math.round(image.width);
  const height = Math.round(image.height);

  const sampleScale = Math.min(1, ANALYSIS_MAX_SIDE / Math.max(width, height));
  const sampleWidth = Math.max(1, Math.round(width * sampleScale));
  const sampleHeight = Math.max(1, Math.round(height * sampleScale));

  const canvas = createCanvas(sampleWidth, sampleHeight);
  const context = canvas.getContext('2d');
  context.drawImage(image, 0, 0, sampleWidth, sampleHeight);

  const { data } = await context.getImageData(0, 0, sampleWidth, sampleHeight);

  const total = sampleWidth * sampleHeight;
  let transparent = 0;
  let opaque = 0;
  let opaqueLuminance = 0;
  let neutralInk = 0;
  let colouredInk = 0;
  let hueX = 0;
  let hueY = 0;

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];

    if (alpha < 128) {
      transparent += 1;
      continue;
    }

    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const luminance = getLuminance(r, g, b);

    if (alpha > 230) {
      opaque += 1;
      opaqueLuminance += luminance;
    }

    // Near-white pixels are the page or plate, not ink.
    if (luminance > 0.92) {
      continue;
    }

    const max = Math.max(r, g, b) / 255;
    const min = Math.min(r, g, b) / 255;
    const chroma = max - min;

    if (chroma < NEUTRAL_CHROMA) {
      neutralInk += 1;
      continue;
    }

    colouredInk += 1;
    const hue = Math.atan2(Math.sqrt(3) * (g - b), 2 * r - g - b);
    hueX += Math.cos(hue);
    hueY += Math.sin(hue);
  }

  const hasTransparency = transparent / total > 0.05;
  const isTile = opaque / total >= 0.9 && opaque > 0 && opaqueLuminance / opaque < 0.88;

  if (isTile) {
    return { width, height, kind: 'tile', hasTransparency: false };
  }

  const ink = neutralInk + colouredInk;

  if (ink === 0) {
    return { width, height, kind: 'multi', hasTransparency };
  }

  const concentration = colouredInk > 0 ? Math.hypot(hueX, hueY) / colouredInk : 1;
  const isGreyOnly = colouredInk === 0;
  const isSingleHue = colouredInk > 0 && neutralInk / ink < 0.12 && concentration >= SINGLE_HUE_CONCENTRATION;

  return { width, height, kind: isGreyOnly || isSingleHue ? 'one-colour' : 'multi', hasTransparency };
};

const drawLogo = async (input: Uint8Array, canvas: Canvas, x: number, y: number, width: number, height: number) => {
  const image = await loadImage(Buffer.from(input));
  const context = canvas.getContext('2d');
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, x, y, width, height);

  return context;
};

/**
 * Renders one variant at 2x. `size` is the logo's display size in CSS pixels (from `getLogoSize`).
 */
export const renderEmailLogoVariant = async (
  input: Uint8Array,
  analysis: EmailLogoAnalysis,
  variant: EmailLogoVariant,
  size: LogoSize,
): Promise<Buffer> => {
  const logoWidth = size.width * SCALE;
  const logoHeight = size.height * SCALE;

  const wantsDarkVersion = variant === 'dark' && analysis.kind === 'one-colour';
  const wantsPlate = analysis.kind !== 'tile' && !wantsDarkVersion;

  if (wantsDarkVersion) {
    const canvas = createCanvas(logoWidth, logoHeight);
    const context = await drawLogo(input, canvas, 0, 0, logoWidth, logoHeight);
    const imageData = await context.getImageData(0, 0, logoWidth, logoHeight);
    const { data } = imageData;

    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3] / 255;
      const strength = analysis.hasTransparency
        ? 1
        : Math.min(1, Math.max(0, (1 - getLuminance(data[i], data[i + 1], data[i + 2])) * 1.6));

      data[i] = DARK_FILL;
      data[i + 1] = DARK_FILL;
      data[i + 2] = DARK_FILL;
      data[i + 3] = Math.round(alpha * strength * 255);
    }

    await context.putImageData(imageData, 0, 0);

    return await canvas.toBuffer('png');
  }

  if (!wantsPlate) {
    const canvas = createCanvas(logoWidth, logoHeight);
    await drawLogo(input, canvas, 0, 0, logoWidth, logoHeight);

    return await canvas.toBuffer('png');
  }

  const padX = PLATE_PADDING_X * SCALE;
  const padY = PLATE_PADDING_Y * SCALE;
  const canvas = createCanvas(logoWidth + padX * 2, logoHeight + padY * 2);
  const context = canvas.getContext('2d');

  context.fillStyle = '#FFFFFF';
  context.beginPath();
  context.roundRect(0, 0, canvas.width, canvas.height, PLATE_RADIUS * SCALE);
  context.fill();

  await drawLogo(input, canvas, padX, padY, logoWidth, logoHeight);

  return await canvas.toBuffer('png');
};
