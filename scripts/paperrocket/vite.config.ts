import path from 'node:path';
import { lingui } from '@lingui/vite-plugin';
import { defineConfig } from 'vite';
import macrosPlugin from 'vite-plugin-babel-macros';
import tsconfigPaths from 'vite-tsconfig-paths';

/**
 * paperrocket-sign: config for running the snapshot scripts with vite-node,
 * so Lingui macros (msg, Trans) compile the same way as in the app and the
 * email preview (packages/email/preview/vite.config.ts).
 */
export default defineConfig({
  root: path.join(__dirname, '../..'),
  plugins: [macrosPlugin(), lingui(), tsconfigPaths()],
  ssr: {
    noExternal: ['@documenso/email', '@documenso/lib'],
    external: [
      '@napi-rs/canvas',
      'skia-canvas',
      '@node-rs/bcrypt',
      '@prisma/client',
      '@documenso/tailwind-config',
      'playwright',
      'playwright-core',
      '@playwright/browser-chromium',
      'pdfjs-dist',
      '@google-cloud/kms',
      '@google-cloud/secret-manager',
    ],
  },
});
