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
