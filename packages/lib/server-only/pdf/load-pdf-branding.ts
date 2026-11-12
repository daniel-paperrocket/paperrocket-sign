import { prisma } from '@documenso/prisma';
import { DocumentDataType } from '@prisma/client';

import { getFileServerSide } from '../../universal/upload/get-file.server';
import { normalizeColorToHex } from '../../utils/email-branding-colors';
import { ZCssVarsSchema } from '../../types/css-vars';
import { getTeamSettings } from '../team/get-team-settings';
import { DEFAULT_PDF_BRAND_COLOR } from './paperrocket-pdf-branding';
import type { PdfBranding } from './paperrocket-pdf-branding';

// paperrocket-sign: the certificate and audit log read the same branding settings as the emails.

const parseStoredLogo = (value: string): { type: DocumentDataType; data: string } | null => {
  try {
    const parsed: unknown = JSON.parse(value);

    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'type' in parsed &&
      'data' in parsed &&
      typeof parsed.data === 'string' &&
      (parsed.type === DocumentDataType.BYTES ||
        parsed.type === DocumentDataType.BYTES_64 ||
        parsed.type === DocumentDataType.S3_PATH)
    ) {
      return { type: parsed.type, data: parsed.data };
    }
  } catch {
    // Not JSON: nothing usable stored.
  }

  return null;
};

export const loadPdfBranding = async ({ teamId }: { teamId: number }): Promise<PdfBranding> => {
  const [settings, team] = await Promise.all([
    getTeamSettings({ teamId }),
    prisma.team.findFirst({
      where: { id: teamId },
      select: { name: true, organisation: { select: { name: true } } },
    }),
  ]);

  const businessName = team?.organisation.name ?? team?.name ?? '';

  if (!settings.brandingEnabled) {
    return { businessName, primaryColor: DEFAULT_PDF_BRAND_COLOR, logo: null, companyDetails: null };
  }

  const parsedColors = settings.brandingColors ? ZCssVarsSchema.safeParse(settings.brandingColors) : null;
  const primaryColor =
    (parsedColors?.success ? normalizeColorToHex(parsedColors.data.primary) : null) ?? DEFAULT_PDF_BRAND_COLOR;

  let logo: Uint8Array | null = null;

  const storedLogo = settings.brandingLogo ? parseStoredLogo(settings.brandingLogo) : null;

  if (storedLogo) {
    logo = await getFileServerSide(storedLogo).catch(() => null);
  }

  const companyDetails = settings.brandingCompanyDetails?.trim() ? settings.brandingCompanyDetails.trim() : null;

  return { businessName, primaryColor, logo, companyDetails };
};
