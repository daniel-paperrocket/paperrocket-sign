// Colour helpers for the Paper Rocket email layout (DESIGN.md "Brand slots" and "Tokens").
// Pure functions, no dependencies, so they run the same in render, in CI and in tests.

type Rgb = [number, number, number];
type Oklch = { l: number; c: number; h: number };

export const DEFAULT_BRAND_COLOUR = '#141414';
export const INK = '#141414';
export const WHITE = '#FFFFFF';
export const DARK_CARD = '#141416';

export const MIN_TEXT_CONTRAST = 4.5;

export const parseHex = (value: string | null | undefined): Rgb | null => {
  if (!value) {
    return null;
  }

  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value.trim());

  if (!match) {
    return null;
  }

  const hex = match[1].length === 3 ? [...match[1]].map((char) => char + char).join('') : match[1];

  return [
    Number.parseInt(hex.slice(0, 2), 16),
    Number.parseInt(hex.slice(2, 4), 16),
    Number.parseInt(hex.slice(4, 6), 16),
  ];
};

export const toHex = (rgb: Rgb): string => {
  const part = (channel: number) => Math.round(Math.min(255, Math.max(0, channel))).toString(16).padStart(2, '0');

  return `#${part(rgb[0])}${part(rgb[1])}${part(rgb[2])}`.toUpperCase();
};

/**
 * Returns a normalised `#RRGGBB` brand colour, or the default ink when the value is missing or invalid.
 */
export const normaliseBrandColour = (value: string | null | undefined): string => {
  const rgb = parseHex(value);

  return rgb ? toHex(rgb) : DEFAULT_BRAND_COLOUR;
};

const toLinear = (channel: number) => {
  const value = channel / 255;

  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
};

const fromLinear = (value: number) => {
  const clamped = Math.min(1, Math.max(0, value));

  return 255 * (clamped <= 0.0031308 ? clamped * 12.92 : 1.055 * clamped ** (1 / 2.4) - 0.055);
};

const luminance = (rgb: Rgb) => 0.2126 * toLinear(rgb[0]) + 0.7152 * toLinear(rgb[1]) + 0.0722 * toLinear(rgb[2]);

export const contrastRatio = (a: string, b: string): number => {
  const first = parseHex(a);
  const second = parseHex(b);

  if (!first || !second) {
    return 1;
  }

  const [light, dark] = [luminance(first), luminance(second)].sort((x, y) => y - x);

  return (light + 0.05) / (dark + 0.05);
};

const toOklch = (rgb: Rgb): Oklch => {
  const r = toLinear(rgb[0]);
  const g = toLinear(rgb[1]);
  const b = toLinear(rgb[2]);

  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  const lightness = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  return { l: lightness, c: Math.hypot(a, bb), h: Math.atan2(bb, a) };
};

const oklchToLinearRgb = ({ l, c, h }: Oklch): Rgb => {
  const a = c * Math.cos(h);
  const b = c * Math.sin(h);

  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;

  return [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ];
};

const isInGamut = (rgb: Rgb) => rgb.every((channel) => channel >= -0.0005 && channel <= 1.0005);

const fromOklch = (colour: Oklch): string => {
  let chroma = colour.c;
  let linear = oklchToLinearRgb({ ...colour, c: chroma });

  while (!isInGamut(linear) && chroma > 0) {
    chroma = Math.max(0, chroma - 0.005);
    linear = oklchToLinearRgb({ ...colour, c: chroma });
  }

  return toHex([fromLinear(linear[0]), fromLinear(linear[1]), fromLinear(linear[2])]);
};

/**
 * Whichever of white or ink reads better on the given background.
 */
export const readableTextOn = (background: string): string => {
  return contrastRatio(WHITE, background) >= contrastRatio(INK, background) ? WHITE : INK;
};

export type ButtonColours = {
  fill: string;
  text: string;
};

/**
 * DESIGN.md "Pale primary": white text if it passes 4.5:1, else ink text if that passes,
 * else darken the fill in OKLCH until white passes.
 */
export const getButtonColours = (brand: string): ButtonColours => {
  const fill = normaliseBrandColour(brand);

  if (contrastRatio(WHITE, fill) >= MIN_TEXT_CONTRAST) {
    return { fill, text: WHITE };
  }

  if (contrastRatio(INK, fill) >= MIN_TEXT_CONTRAST) {
    return { fill, text: INK };
  }

  const rgb = parseHex(fill) ?? [20, 20, 20];
  const oklch = toOklch(rgb);
  let darkened = fill;

  for (let l = oklch.l; l > 0 && contrastRatio(WHITE, darkened) < MIN_TEXT_CONTRAST; l -= 0.01) {
    darkened = fromOklch({ ...oklch, l });
  }

  return { fill: darkened, text: WHITE };
};

/**
 * The dark-mode partner of the brand colour: lightened in OKLCH until it reaches 4.5:1 on the dark card.
 */
export const getBrandOnDark = (brand: string, surface: string = DARK_CARD): ButtonColours => {
  const normalised = normaliseBrandColour(brand);
  const rgb = parseHex(normalised) ?? [20, 20, 20];
  const oklch = toOklch(rgb);
  let fill = normalised;

  for (let l = oklch.l; l <= 1 && contrastRatio(fill, surface) < MIN_TEXT_CONTRAST; l += 0.01) {
    fill = fromOklch({ ...oklch, l });
  }

  return { fill, text: readableTextOn(fill) };
};
