# Rolling a tag to a signing site

Generic steps for moving a site running stock `documenso/documenso:<version>` to our image
`ghcr.io/daniel-paperrocket/paperrocket-sign:v<upstream>-pr.<n>`. Site names, hosts, paths and secrets are not in this repo: the real runbook is private. Placeholders are in angle brackets.

**Before starting:** the tag exists, its image build is green, and the security hold on that site is cleared.

## 1. Back up

Copy the compose file and the env file next to themselves with a dated suffix (copy only, never print the env file). Dump the database with `pg_dump -Fc` and check it lists tables with `pg_restore -l`. Copy the signing certificate. Never overwrite an older backup. If uploads are stored in the database, the dump is also the document backup.

## 2. Pin and switch

1. Pull the image and note its digest (`docker image inspect <image> --format '{{index .RepoDigests 0}}'`).
2. Change only the `image:` lines: the app by tag and digest, the database by digest. Diff against the backup: nothing else may differ unless a setting below is being added on purpose.
3. Validate with `docker compose config -q` (without `-q` it prints secrets).
4. `docker compose pull <app> && docker compose up -d`, then watch the logs. Migrations run on start; expect none pending.

## 3. Check

From a logged-out browser or `curl`:
- sign-in goes through the site's identity provider; a password POST with a CSRF token returns 400 `SIGNIN_DISABLED` where password sign-in is off
- a test envelope to an address you own, signed while logged out at 390 px wide
- the invite and completed emails in Gmail on a phone in dark mode, and the certificate PDF
- logs show no errors

## 4. Settings per site

- reply-to email set (the footer says replies reach the sender)
- `NEXT_PUBLIC_SUPPORT_EMAIL` set, or screens fall back to the upstream support address
- `usePlaywrightPdf` off

## 5. Roll back

Image only: put the backed-up compose file back and `docker compose up -d`. If a migration ran, restore the database dump too (this overwrites data: get the owner's go first).
