import { getEmailLogoImage } from '@documenso/lib/server-only/paperrocket/email-logo';
import { Hono } from 'hono';

import type { HonoEnv } from '../../router';

const CACHE_CONTROL = 'public, max-age=31536000, immutable';

/**
 * Letterhead logo images for email: `plate` (white rounded plate baked in, for Gmail) and `dark` (white version of a
 * one-colour logo, for Apple Mail dark mode). The size is derived from the logo's shape on the server, so only a
 * handful of variants can ever be generated per logo. The `v` query is a cache-buster; the content is keyed by the
 * stored logo, not by it.
 */
export const paperRocketEmailLogoRoute = new Hono<HonoEnv>().get('/:kind/:id/:file', async (c) => {
  const { kind, id, file } = c.req.param();

  const variant = file.replace(/\.png$/, '');

  if ((kind !== 'organisation' && kind !== 'team') || (variant !== 'plate' && variant !== 'dark')) {
    return c.json({ status: 'error', message: 'Not found' }, 404);
  }

  const result = await getEmailLogoImage({ kind, id }, variant).catch((err) => {
    console.error(err);

    return null;
  });

  if (!result) {
    return c.json({ status: 'error', message: 'Logo not found' }, 404);
  }

  if (c.req.header('If-None-Match') === result.etag) {
    return new Response(null, { status: 304, headers: { ETag: result.etag, 'Cache-Control': CACHE_CONTROL } });
  }

  return new Response(result.image, {
    headers: {
      'Content-Type': 'image/png',
      'Content-Length': result.image.length.toString(),
      'Cache-Control': CACHE_CONTROL,
      ETag: result.etag,
    },
  });
});
