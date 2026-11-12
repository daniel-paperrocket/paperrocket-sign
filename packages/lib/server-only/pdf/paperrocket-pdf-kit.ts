// sort-imports-ignore
import '../konva/skia-backend';

import { Image as SkiaImage } from '@documenso/skia-canvas';
import Konva from 'konva';

import type { PdfBranding } from './paperrocket-pdf-branding';

// paperrocket-sign: shared type, colours and header for the certificate and audit log (DESIGN.md "Certificate (PDF)").
// Everything is laid out on a 794 wide canvas (A4 at 96 dpi) and scaled to the real page.

export const PDF_DESIGN_WIDTH = 794;

export const pdfColors = {
  ink: '#141414',
  ink2: '#2A2A28',
  muted: '#5C5C58',
  label: '#6B6B66',
  line: '#ECECE8',
  lineStrong: '#BDBDB8',
  timeline: '#E2E2DE',
  ok: '#1F7A4D',
  alert: '#B42318',
  signature: '#1B2740',
  surface: '#FFFFFF',
} as const;

export const pdfLayout = {
  marginX: 72,
  contentWidth: PDF_DESIGN_WIDTH - 72 * 2,
  top: 66,
  bottom: 52,
} as const;

export const MONO_FONT = 'JetBrains Mono';

type TextOptions = Konva.TextConfig;

export const createText = (options: TextOptions) =>
  new Konva.Text({
    fontFamily: 'Inter',
    fontSize: 10.5,
    lineHeight: 1.45,
    fill: pdfColors.ink,
    ...options,
  });

export const createLabel = (text: string, options: TextOptions & { size?: number }) => {
  const { size = 8.5, ...rest } = options;

  return createText({
    text: text.toUpperCase(),
    fontSize: size,
    fontStyle: '600',
    letterSpacing: size * 0.09,
    fill: pdfColors.label,
    lineHeight: 1.4,
    ...rest,
  });
};

export const createMono = (options: TextOptions) =>
  createText({
    fontFamily: MONO_FONT,
    fontSize: 10,
    lineHeight: 1.45,
    fill: pdfColors.ink2,
    ...options,
  });

export const createHairline = (y: number, options?: { x?: number; width?: number; color?: string }) =>
  new Konva.Line({
    points: [options?.x ?? 0, y + 0.5, (options?.x ?? 0) + (options?.width ?? pdfLayout.contentWidth), y + 0.5],
    stroke: options?.color ?? pdfColors.line,
    strokeWidth: 1,
  });

export const createPageBackground = (width: number, height: number) =>
  new Konva.Rect({ x: 0, y: 0, width, height, fill: pdfColors.surface });

export const loadLogoImage = (bytes: Uint8Array | null): HTMLImageElement | null => {
  if (!bytes) {
    return null;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const image = new SkiaImage(Buffer.from(bytes)) as unknown as HTMLImageElement;

    return image.width > 0 && image.height > 0 ? image : null;
  } catch {
    return null;
  }
};

/**
 * Logo sizing by shape, certificate column of DESIGN.md "Logo sizing".
 */
export const getLogoSize = (ratio: number, compact: boolean): { width: number; height: number } => {
  let width: number;
  let height: number;

  if (ratio >= 3) {
    width = Math.min(232, 40 * ratio);
    height = width / ratio;
  } else if (ratio >= 1.4) {
    height = 56;
    width = height * ratio;
  } else if (ratio >= 0.7) {
    height = 56;
    width = height * ratio;
  } else {
    height = 64;
    width = height * ratio;
  }

  if (compact) {
    const factor = 24 / height;

    return { width: width * factor, height: 24 };
  }

  return { width, height };
};

type RenderLetterheadOptions = {
  branding: PdfBranding;
  logoImage: HTMLImageElement | null;
  envelopeId: string;
  envelopeLabel: string;
  compact?: boolean;
};

/**
 * Logo (or the business name as a wordmark) top left, envelope id top right.
 * Returns the group and the height it uses.
 */
export const renderLetterhead = (options: RenderLetterheadOptions) => {
  const { branding, logoImage, envelopeId, envelopeLabel, compact = false } = options;

  const group = new Konva.Group({ x: pdfLayout.marginX, y: pdfLayout.top });

  let leftHeight = 0;

  if (logoImage) {
    const size = getLogoSize(logoImage.width / logoImage.height, compact);

    group.add(new Konva.Image({ image: logoImage, x: 0, y: 0, width: size.width, height: size.height }));
    leftHeight = size.height;
  } else if (branding.businessName) {
    const wordmark = createText({
      text: branding.businessName,
      fontSize: compact ? 13 : 19,
      fontStyle: '600',
      letterSpacing: compact ? -0.13 : -0.19,
      lineHeight: 1.5,
      width: pdfLayout.contentWidth * 0.6,
      wrap: 'none',
      ellipsis: true,
    });

    group.add(wordmark);
    leftHeight = wordmark.height();
  }

  const refWidth = pdfLayout.contentWidth * 0.4;

  const refLabel = createLabel(envelopeLabel, {
    x: pdfLayout.contentWidth - refWidth,
    y: 0,
    width: refWidth,
    align: 'right',
    size: 9,
    letterSpacing: 9 * 0.08,
    lineHeight: 1.7,
  });

  const refId = createMono({
    x: pdfLayout.contentWidth - refWidth,
    y: refLabel.height(),
    width: refWidth,
    align: 'right',
    text: envelopeId,
    lineHeight: 1.7,
    wrap: 'none',
    ellipsis: true,
  });

  group.add(refLabel);
  group.add(refId);

  return { group, height: Math.max(leftHeight, refLabel.height() + refId.height()) };
};
