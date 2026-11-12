# paperrocket-sign patches

Local changes on top of upstream Documenso. Re-apply on each rebase. Each patch point carries the comment `paperrocket-sign: AI stripped (Daniel, 13 Nov 2026)`.

## AI stripped

No files deleted, no dependencies or schema touched. The `GOOGLE_VERTEX_*` env vars now do nothing.

- `packages/lib/constants/app.ts`: `IS_AI_FEATURES_CONFIGURED()` always returns false (server and client). Every upstream AI gate keys off this.
- `packages/lib/utils/teams.ts`: `extractDerivedTeamSettings` forces `aiFeaturesEnabled = false`. Covers server `team.derivedSettings` and the client `team.preferences` (via `get-organisation-session`), so the `?ai=true` links in the upload button and drop zone are never added.
- `apps/remix/server/api/ai/route.ts`: no sub-routes registered, so `/api/ai/detect-fields` and `/api/ai/detect-recipients` return 404.
- `apps/remix/app/routes/embed+/v2+/authoring+/_layout.tsx`: embed authoring `preferences.aiFeaturesEnabled` set to false (two places).
- `apps/remix/app/components/general/envelope-editor/envelope-editor-fields-page.tsx`: "Detect fields with AI" button and dialogs only render when `IS_AI_FEATURES_CONFIGURED()` (now never). Hides the "enable AI" prompt.
- `apps/remix/app/components/general/envelope-editor/envelope-editor-recipient-form.tsx`: same for the recipient sparkles button and the AI recipient dialog (two places).
- `apps/remix/app/components/general/admin-global-settings-section.tsx`: removed the "AI features" row from the admin settings view.

Already hidden upstream by `IS_AI_FEATURES_CONFIGURED()`: the AI toggle in `document-preferences-form.tsx`.
Left alone (inert): AI docs pages, `.env.example`, `@ai-sdk/google-vertex` dependency, `aiFeaturesEnabled` DB columns and tRPC settings inputs, the unused dialog and server-only AI files.

## Certificate and audit log

Redrawn to DESIGN.md "Certificate (PDF)" and "Times". The "Signing certificate provided by Documenso" credit is gone whatever `hidePoweredBy` says (the option is accepted and ignored). Branding (logo, `brandingColors.primary`, `brandingCompanyDetails`, organisation name) comes from the team's inherited branding settings, the same ones the emails use.

Upstream files touched:
- `packages/lib/server-only/pdf/render-certificate.ts`: rewritten (letterhead, facts grid, signer blocks, footer, zoned times, no credit).
- `packages/lib/server-only/pdf/render-audit-logs.ts`: rewritten to the same type, colours and header, content and structure kept, zoned times, no credit.
- `packages/lib/server-only/pdf/generate-certificate-pdf.ts`: loads PDF branding instead of the organisation claim, passes title, `documentMeta.timezone`, signing order and branding to the renderer.
- `packages/lib/server-only/pdf/generate-audit-log-pdf.ts`: loads PDF branding instead of the organisation claim, passes it to the renderer.
- `packages/lib/server-only/pdf/helpers.ts`: registers JetBrains Mono in `ensureFontLibrary`.
- `apps/remix/public/fonts/jetbrains-mono-regular.ttf`: added (JetBrains Mono Regular 2.304, OFL).

New files (not upstream): `packages/lib/server-only/pdf/format-zoned-time.ts` and `.test.ts`, `load-pdf-branding.ts`, `paperrocket-pdf-branding.ts`, `paperrocket-pdf-kit.ts`, and `scripts/paperrocket/render-certificate-snapshot.ts`.

## Templates

Emails rewritten to DESIGN.md "Email". New code lives in `packages/email/paperrocket/` (layout, parts, colour, logo, theme), `packages/lib/server-only/paperrocket/` (logo analysis and variants) and `apps/remix/server/api/paperrocket/` (logo route). `packages/email/template-components/` is left in place, unused by the templates. Lingui msgids changed, so non-English locales fall back to English until retranslated.

Upstream files touched:
- `packages/email/providers/branding.tsx`: optional `brandingName` and `brandingLogoMeta` on the branding context.
- `packages/lib/server-only/email/get-email-context.ts`: adds organisation name and logo metadata to `branding` (both returns).
- `apps/remix/server/router.ts`: mounts `/api/paperrocket/email-logo`.
- `packages/email/templates/access-auth-2fa.tsx`: rewritten on `PaperRocketEmail`, same exports and props.
- `packages/email/templates/account-disabled.tsx`: rewritten on `PaperRocketEmail`, same exports and props.
- `packages/email/templates/admin-user-created.tsx`: rewritten on `PaperRocketEmail`, same exports and props.
- `packages/email/templates/bulk-send-complete.tsx`: rewritten on `PaperRocketEmail`, same exports and props.
- `packages/email/templates/confirm-email.tsx`: rewritten on `PaperRocketEmail`, same exports and props.
- `packages/email/templates/confirm-team-email.tsx`: rewritten on `PaperRocketEmail`, same exports and props.
- `packages/email/templates/document-cancel.tsx`: rewritten on `PaperRocketEmail`, same exports and props.
- `packages/email/templates/document-completed.tsx`: rewritten on `PaperRocketEmail`, same exports and props.
- `packages/email/templates/document-created-from-direct-template.tsx`: rewritten on `PaperRocketEmail`, same exports and props.
- `packages/email/templates/document-invite.tsx`: rewritten on `PaperRocketEmail`, same exports and props.
- `packages/email/templates/document-pending.tsx`: rewritten on `PaperRocketEmail`, same exports and props.
- `packages/email/templates/document-recipient-signed.tsx`: rewritten on `PaperRocketEmail`, same exports and props.
- `packages/email/templates/document-rejected.tsx`: rewritten on `PaperRocketEmail`, same exports and props.
- `packages/email/templates/document-rejection-confirmed.tsx`: rewritten on `PaperRocketEmail`, same exports and props.
- `packages/email/templates/document-reminder.tsx`: rewritten on `PaperRocketEmail`, same exports and props.
- `packages/email/templates/document-self-signed.tsx`: rewritten on `PaperRocketEmail`, same exports and props.
- `packages/email/templates/document-super-delete.tsx`: rewritten on `PaperRocketEmail`, same exports and props.
- `packages/email/templates/forgot-password.tsx`: rewritten on `PaperRocketEmail`, same exports and props.
- `packages/email/templates/organisation-account-link-confirmation.tsx`: rewritten on `PaperRocketEmail`, same exports and props.
- `packages/email/templates/organisation-delete.tsx`: rewritten on `PaperRocketEmail`, same exports and props.
- `packages/email/templates/organisation-invite.tsx`: rewritten on `PaperRocketEmail`, same exports and props.
- `packages/email/templates/organisation-join.tsx`: rewritten on `PaperRocketEmail`, same exports and props.
- `packages/email/templates/organisation-leave.tsx`: rewritten on `PaperRocketEmail`, same exports and props.
- `packages/email/templates/organisation-limit-alert.tsx`: rewritten on `PaperRocketEmail`, same exports and props.
- `packages/email/templates/organisation-limits-updated.tsx`: rewritten on `PaperRocketEmail`, same exports and props.
- `packages/email/templates/recipient-expired.tsx`: rewritten on `PaperRocketEmail`, same exports and props.
- `packages/email/templates/recipient-removed-by-admin.tsx`: rewritten on `PaperRocketEmail`, same exports and props.
- `packages/email/templates/recipient-removed-from-document.tsx`: rewritten on `PaperRocketEmail`, same exports and props.
- `packages/email/templates/reset-password.tsx`: rewritten on `PaperRocketEmail`, same exports and props.
- `packages/email/templates/team-delete.tsx`: rewritten on `PaperRocketEmail`, same exports and props.
- `packages/email/templates/team-email-removed.tsx`: rewritten on `PaperRocketEmail`, same exports and props.

New, not upstream: `scripts/paperrocket/render-snapshots.ts`.
