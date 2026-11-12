import type { EmailLogoMeta, EmailLogoVariant } from '@documenso/email/paperrocket/logo';
import { getLogoSize } from '@documenso/email/paperrocket/logo';
import { prisma } from '@documenso/prisma';

import { NEXT_PUBLIC_WEBAPP_URL } from '../../constants/app';
import { sha256 } from '../../universal/crypto';
import { getFileServerSide } from '../../universal/upload/get-file.server';
import { loadLogo } from '../../utils/images/logo';
import { logger } from '../../utils/logger';
import { getTeamSettings } from '../team/get-team-settings';
import type { EmailLogoAnalysis } from './email-logo-image';
import { analyseEmailLogo, renderEmailLogoVariant } from './email-logo-image';

export type EmailLogoOwner = {
  kind: 'organisation' | 'team';
  id: string;
};

type CachedLogo = {
  source: Uint8Array;
  analysis: EmailLogoAnalysis;
  variants: Map<EmailLogoVariant, Buffer>;
};

const MAX_CACHED_LOGOS = 200;

// One entry per logo upload (keyed by a hash of the stored reference), so a changed logo is picked up at once.
const cache = new Map<string, CachedLogo>();

const loadBrandingLogoReference = async ({ kind, id }: EmailLogoOwner) => {
  if (kind === 'organisation') {
    const organisation = await prisma.organisation.findUnique({
      where: { id },
      include: { organisationGlobalSettings: true },
    });

    return organisation?.organisationGlobalSettings ?? null;
  }

  const teamId = Number(id);

  if (!Number.isInteger(teamId) || teamId <= 0) {
    return null;
  }

  return await getTeamSettings({ teamId });
};

const getCachedLogo = async (owner: EmailLogoOwner) => {
  const settings = await loadBrandingLogoReference(owner);

  if (!settings?.brandingEnabled || !settings.brandingLogo) {
    return null;
  }

  const key = Buffer.from(sha256(settings.brandingLogo)).toString('hex');
  const cacheKey = `${owner.kind}:${owner.id}:${key}`;
  const existing = cache.get(cacheKey);

  if (existing) {
    return { key, logo: existing };
  }

  const file = await getFileServerSide(JSON.parse(settings.brandingLogo));
  const { content } = await loadLogo(file);
  const source = new Uint8Array(content);
  const analysis = await analyseEmailLogo(source);

  if (cache.size >= MAX_CACHED_LOGOS) {
    const oldest = cache.keys().next().value;

    if (oldest !== undefined) {
      cache.delete(oldest);
    }
  }

  const logo: CachedLogo = { source, analysis, variants: new Map() };
  cache.set(cacheKey, logo);

  return { key, logo };
};

/**
 * One 2x PNG variant of the organisation's logo, sized by its shape (DESIGN.md "Logo sizing").
 * Returns null when the owner has no branding logo.
 */
export const getEmailLogoImage = async (owner: EmailLogoOwner, variant: EmailLogoVariant) => {
  const found = await getCachedLogo(owner);

  if (!found) {
    return null;
  }

  const { key, logo } = found;
  let image = logo.variants.get(variant);

  if (!image) {
    image = await renderEmailLogoVariant(logo.source, logo.analysis, variant, getLogoSize(logo.analysis));
    logo.variants.set(variant, image);
  }

  return { image, etag: `"${key}-${variant}"` };
};

/**
 * Natural size, colour behaviour and image URL for the email letterhead. Undefined when there is no logo or it
 * can't be read; the email then shows the organisation name as a wordmark.
 */
export const getEmailLogoMeta = async (owner: EmailLogoOwner): Promise<EmailLogoMeta | undefined> => {
  try {
    const found = await getCachedLogo(owner);

    if (!found) {
      return undefined;
    }

    const { key, logo } = found;

    return {
      width: logo.analysis.width,
      height: logo.analysis.height,
      kind: logo.analysis.kind,
      urlTemplate: `${NEXT_PUBLIC_WEBAPP_URL()}/api/paperrocket/email-logo/${owner.kind}/${owner.id}/{variant}.png?v=${key.slice(0, 12)}`,
    };
  } catch (err) {
    logger.error({ err, owner }, 'Could not prepare the email logo');

    return undefined;
  }
};
