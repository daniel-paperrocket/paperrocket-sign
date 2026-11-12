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

## Upstream workflows removed

Only `.github/workflows/paperrocket.yml` runs in this fork (security audit, 13 Nov 2026). Deleted: ci, codeql-analysis, deploy, e2e-tests, first-interaction, issue-labeler, issue-opened, pr-labeler, publish, semantic-pull-requests, stale, translations-force-pull, translations-pull, translations-upload. On a rebase, if upstream changes one of these, keep it deleted.

## CI hardening (PAP-1457)

- `.github/actions/node-install/action.yml`: `actions/setup-node` pinned to a commit SHA (v4.4.0) instead of the `v4` tag. Every action in `.github/workflows/paperrocket.yml` is pinned the same way. On a rebase, keep the pins and re-pin when bumping.
- `.github/workflows/paperrocket.yml`: type-check and zoned-time unit test steps, pull requests on `pr/**` bases get CI, and a check step. `scripts/paperrocket/check-no-infra.sh` (ours, a plain grep) fails the build when the files we own, or the lines a PR adds, name a client, a host or a server path. Keep it on a rebase.
