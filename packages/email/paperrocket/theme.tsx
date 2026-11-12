import { env } from '@documenso/lib/utils/env';
import { createContext, useContext } from 'react';

import { useBranding } from '../providers/branding';
import { getSafeBrandingUrl } from '../utils/branding-url';
import type { ButtonColours } from './colour';
import { DEFAULT_BRAND_COLOUR, getBrandOnDark, getButtonColours, normaliseBrandColour } from './colour';
import type { EmailLogoMeta } from './logo';
import { isValidLogoMeta } from './logo';

export type PaperRocketTheme = {
  /** Business name: logo alt text, wordmark, footer line. */
  name: string;
  /** Raw brand colour (stripe, message rule). */
  brand: string;
  /** Button fill and text for light mode. */
  button: ButtonColours;
  /** Brand colour lightened for the dark card, and its button text. */
  dark: ButtonColours;
  logo: EmailLogoMeta | null;
  /** Where the logo links to, if the organisation set a safe website. */
  logoHref: string | null;
  /** Footer site link. */
  siteHref: string | null;
  siteLabel: string | null;
  detailLines: string[];
};

const ThemeContext = createContext<PaperRocketTheme | null>(null);

export const ThemeProvider = ThemeContext.Provider;

/**
 * The theme for the current email. react-email's Tailwind wrapper calls components as plain functions, so a
 * context provided inside it never reaches them: when there is no provider, the theme is rebuilt from the
 * branding provider, which sits outside Tailwind. Both hooks always run so the hook order is stable.
 */
export const usePaperRocketTheme = (): PaperRocketTheme => {
  const provided = useContext(ThemeContext);
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  const built = useBuildPaperRocketTheme(env('NEXT_PUBLIC_WEBAPP_URL') ?? null);

  return provided ?? built;
};

const FALLBACK_NAME = 'Document signing';

/**
 * Builds the per-email theme from the organisation branding (name, logo, primary colour, details, website).
 */
export const useBuildPaperRocketTheme = (fallbackSiteUrl: string | null): PaperRocketTheme => {
  const branding = useBranding();
  const isBranded = branding.brandingEnabled;

  const detailLines = isBranded
    ? (branding.brandingCompanyDetails ?? '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
    : [];

  const brandingUrl = isBranded ? getSafeBrandingUrl(branding.brandingUrl) : null;
  const siteHref = brandingUrl ?? getSafeBrandingUrl(fallbackSiteUrl);

  const name =
    branding.brandingName?.trim() ||
    detailLines[0] ||
    (siteHref ? (URL.parse(siteHref)?.hostname ?? FALLBACK_NAME) : FALLBACK_NAME);

  const brand = normaliseBrandColour(branding.brandingColors?.primary ?? DEFAULT_BRAND_COLOUR);

  const logo = isBranded && branding.brandingLogo && isValidLogoMeta(branding.brandingLogoMeta) ? branding.brandingLogoMeta : null;

  return {
    name,
    brand,
    button: getButtonColours(brand),
    dark: getBrandOnDark(brand),
    logo,
    logoHref: brandingUrl,
    siteHref,
    siteLabel: siteHref ? (URL.parse(siteHref)?.host ?? null) : null,
    // The first detail line is often the business name itself; the footer already shows the name.
    detailLines: detailLines[0] === name ? detailLines.slice(1) : detailLines,
  };
};

