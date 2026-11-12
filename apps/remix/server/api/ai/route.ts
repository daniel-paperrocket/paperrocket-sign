import { Hono } from 'hono';

import type { HonoEnv } from '../../router';
import { detectFieldsRoute } from './detect-fields';
import { detectRecipientsRoute } from './detect-recipients';

// Unused imports above are kept to keep the diff small.
// paperrocket-sign: AI stripped (Daniel, 13 Nov 2026)
void detectRecipientsRoute;
void detectFieldsRoute;
export const aiRoute = new Hono<HonoEnv>();
