// Letterhead logo sizing and image URLs (DESIGN.md "Logo sizing").

/**
 * How the logo behaves on the light plate and in designed dark mode:
 * - `one-colour`: a white version swaps in for dark mode.
 * - `multi`: keeps the plate in dark mode too.
 * - `tile`: a logo on its own full-bleed tile, shown unchanged, no plate.
 */
export type EmailLogoKind = 'one-colour' | 'multi' | 'tile';

export type EmailLogoMeta = {
  /** Natural size of the uploaded logo in pixels. */
  width: number;
  height: number;
  kind: EmailLogoKind;
  /**
   * Image URL with `{variant}` (`plate` or `dark`), `{w}` and `{h}` (the logo's display size in CSS pixels).
   * The PNG comes back at 2x.
   */
  urlTemplate: string;
};

export type EmailLogoVariant = 'plate' | 'dark';

/** Plate padding baked into the light PNG (CSS pixels), plus its corner radius. */
export const PLATE_PADDING_X = 14;
export const PLATE_PADDING_Y = 10;
export const PLATE_RADIUS = 10;

export type LogoSize = { width: number; height: number };

const round = (value: number) => Math.max(1, Math.round(value));

/**
 * Size from the aspect ratio. Wide wordmarks are sized by width, the rest by height.
 */
export const getLogoSize = (
  natural: { width: number; height: number },
  options: { phone?: boolean; certificate?: boolean } = {},
): LogoSize => {
  const ratio = natural.width / natural.height;
  const { phone = false, certificate = false } = options;

  if (ratio >= 3) {
    const maxWidth = certificate || phone ? 232 : 264;
    const width = Math.min(maxWidth, (certificate ? 40 : 48) * ratio);

    return { width: round(width), height: round(width / ratio) };
  }

  let height = 80;

  if (ratio >= 1.4) {
    height = certificate ? 56 : 64;
  } else if (ratio >= 0.7) {
    height = certificate ? 56 : 72;
  } else if (certificate) {
    height = 64;
  }

  return { width: round(height * ratio), height };
};

export const getLogoUrl = (meta: EmailLogoMeta, variant: EmailLogoVariant, size: LogoSize): string => {
  return meta.urlTemplate
    .replace('{variant}', variant)
    .replace('{w}', String(size.width))
    .replace('{h}', String(size.height));
};

export const isValidLogoMeta = (meta: EmailLogoMeta | undefined): meta is EmailLogoMeta => {
  return Boolean(meta && meta.width > 0 && meta.height > 0 && meta.urlTemplate);
};
