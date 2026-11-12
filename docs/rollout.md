# Rolling the paperrocket-sign image to a signing site

Steps to move a live signing site from `documenso/documenso:v2.21.1` to our own image `ghcr.io/daniel-paperrocket/paperrocket-sign:v<upstream>-pr.<n>`. Written 13 Nov 2026 by sign-templates-3 from a read-only look at pr-vps.
Order: sign.constructiveconsultants.co.nz first, then sign.paperrocket.nz the same way.

**Do not start until:** PAP-1457 is cleared (items 1 and 2), PR #1 and PR #2 are merged into `paperrocket` on Daniel's word (PAP-1472), the tag `v2.21.1-pr.1` exists and its image build is green. This document runs nothing by itself.

## What is on the server now (read only, 13 Nov)

| | Constructive |
|---|---|
| Folder | `/srv/paperrocket/sign-constructive/` (root; `.env` is mode 600) |
| Containers | `sign-constructive-documenso-1` (`documenso/documenso:v2.21.1`), `sign-constructive-database-1` (`postgres:15`) |
| Volume | `sign-constructive_database` |
| Port | `127.0.0.1:3110` to the app's 3000 |
| `.env` names | `DB_PASSWORD`, `NEXTAUTH_SECRET`, `ENCRYPTION_KEY`, `ENCRYPTION_SECONDARY_KEY`, `SIGNING_PASSPHRASE`, `RESEND_API_KEY`, `OIDC_CLIENT_SECRET` (values never printed) |
| Compose OIDC lines | `NEXT_PRIVATE_OIDC_WELL_KNOWN`, `NEXT_PRIVATE_OIDC_CLIENT_ID=sign-constructive`, `NEXT_PRIVATE_OIDC_CLIENT_SECRET`, `NEXT_PRIVATE_OIDC_PROVIDER_LABEL`, `NEXT_PUBLIC_DISABLE_EMAIL_PASSWORD_SIGNIN`, `NEXT_PUBLIC_DISABLE_SIGNUP=true` |
| Signing cert | `./cert/cert.p12` mounted read only at `/opt/documenso/cert.p12` |
| Uploads | `NEXT_PUBLIC_UPLOAD_TRANSPORT=database` (documents live in Postgres, so the database dump is the document backup) |
| Digests running now | app `documenso/documenso@sha256:41a69062febc915d1508b87be8c5bbe72ecd3c49232ddcd983490f5f7832f053`; database `postgres@sha256:1aac5b49cefd627f02816141ca4ad012d6cc19460dfe02a9b5168a105be3fc53` |

sign.paperrocket.nz: not looked at yet. `/srv/paperrocket/documenso` is a different, older instance. Fill in its own table before its rollout and do not assume it matches.

The only changes to the compose file are the two `image:` lines (our image, and postgres pinned by digest). Everything else stays exactly as it is, above all the OIDC lines, `OIDC_CLIENT_SECRET` and the cert mount. PATCHES.md lists no schema, dependency or new env changes, so no new variables are needed.

## 0. Before the window

1. Pick a quiet time. Tell the Constructive contacts (Daniel's call: draft only, never sent by a chat). Expect about 2 minutes of downtime.
2. Check pr-vps: at least 3 GB memory available (1-pr-products' rule) and disk under 85 percent. `ssh pr-vps 'free -m; df -h /'`.
3. Pull the image before the window (changes nothing running). The GHCR package must be public, or the server must be logged in: `sudo docker pull ghcr.io/daniel-paperrocket/paperrocket-sign:v2.21.1-pr.1`.
4. Note its digest: `sudo docker image inspect ghcr.io/daniel-paperrocket/paperrocket-sign:v2.21.1-pr.1 --format '{{index .RepoDigests 0}}'`.

## 1. Back up (PAP-1457 done-when)

On pr-vps, in `/srv/paperrocket/sign-constructive/`, with a dated suffix (NZ date: `TZ=Pacific/Auckland date +%F-%H%M`):

```sh
D=$(TZ=Pacific/Auckland date +%F-%H%M)
cd /srv/paperrocket/sign-constructive
sudo cp -p compose.yml compose.yml.bak-$D-pre-pr-image
sudo cp -p .env .env.bak-$D-pre-pr-image        # copy only: never cat or print it
sudo cp -p cert/cert.p12 cert/cert.p12.bak-$D
sudo sh -c "docker compose exec -T database pg_dump -U documenso -d documenso -Fc > db-$D.dump"
sudo chmod 600 db-$D.dump
sudo sh -c "docker compose exec -T database pg_restore -l < db-$D.dump | head"   # must list tables
ls -la
```

The earlier rollback copies (`*.bak-2026-11-13-pre-oidc`, `*.bak-2026-11-12-initial`) stay where they are: never overwrite them. If the dump holds real client documents, also copy it off the box to Daniel's usual backup place.

## 2. Pin by digest, then switch the image

1. Edit `compose.yml`, only these two `image:` lines:
   - app: `image: ghcr.io/daniel-paperrocket/paperrocket-sign:v2.21.1-pr.1@sha256:<digest from 0.4>`
   - database: `image: postgres:15@sha256:1aac5b49cefd627f02816141ca4ad012d6cc19460dfe02a9b5168a105be3fc53`
2. `diff compose.yml.bak-$D-pre-pr-image compose.yml` must show those two lines and nothing else. Anything more: stop.
3. `sudo docker compose config -q` validates and prints nothing. Never run `docker compose config` without `-q`: it prints secrets.
4. `sudo docker compose pull documenso && sudo docker compose up -d`. The database container is not recreated while its digest matches what is running.
5. Watch the start: `sudo docker compose logs -f --tail=50 documenso`. `prisma migrate deploy` runs first (docker/start.sh). Expect no pending migrations, then the server listening. Ctrl-C when it is up. Never paste env values from logs.

## 3. Smoke test (PAP-1457 done-when, from constructive-sign)

From `curl` or a throwaway Playwright profile, never Daniel's signed-in browser.

1. `/signin` redirects to `auth.paperrocket.nz`: `curl -sI https://sign.constructiveconsultants.co.nz/signin`, then follow the redirect to the OIDC authorize URL.
2. A password POST with a CSRF token returns `400 SIGNIN_DISABLED`. Get the token from `/api/auth/csrf`, POST made-up credentials to the credentials sign-in. Not 401, never a session.
3. Daniel signs in through the OIDC button (his login) and the dashboard loads.
4. A test envelope: a one-page PDF to a Gmail address Daniel owns (never a client). Sign it from a logged-out browser at **390 px wide** (Playwright `viewport 390x844`, screenshot). Check branding, no sideways scroll, the field can be filled, Complete works.
5. Check the invite and completed emails in **Gmail on the phone in dark mode**: dark logo band, button visible, domains styled, text readable. Compare with the CI artifact `snapshots-dark`. Open the certificate PDF too.
6. `sudo docker compose logs --since 10m documenso | grep -i -E "error|fail" | head` is clean.
7. Delete the test envelope in the app (it is ours).

If 1 to 3 fail, roll back at once.

## 4. Rollback

Image only (no data change; use when the app misbehaves and step 2.5 showed no migration):

```sh
cd /srv/paperrocket/sign-constructive
sudo cp -p compose.yml.bak-$D-pre-pr-image compose.yml
sudo docker compose up -d
```

That returns to `documenso/documenso:v2.21.1`. If a migration ran, the older image may refuse the newer schema. Restore the data too (overwrites the database, so Daniel's go first):

```sh
sudo docker compose stop documenso
sudo docker compose exec -T database dropdb -U documenso documenso
sudo docker compose exec -T database createdb -U documenso documenso
sudo sh -c "docker compose exec -T database pg_restore -U documenso -d documenso --no-owner < db-$D.dump"
sudo docker compose up -d
```

Then repeat smoke tests 1 and 3. `.env` is not edited by this rollout. If it ever was, restore it with `sudo cp -p .env.bak-$D-pre-pr-image .env`.

## 5. After

- Update STATUS.md, the registry (image and tag for the site) and PAP-1441 and PAP-1457 with a 🤖 comment: tag, digest, backup file names, smoke test results, the 390 px screenshot.
- Keep the backups 30 days, then ask before deleting.
- Next upstream tag: rebase per PATCHES.md, a new `-pr.<n>`, repeat this document with the new image's digest. Rolling forward is the one `image:` line.

## 6. sign.paperrocket.nz

Same steps with its own folder, containers and OIDC client. Check first:
- Its sign-in goes through `auth.paperrocket.nz` too (PAP-1448), so its OIDC client must exist in the broker before the rollout. If not, that is the blocker.
- Sender and branding are Paper Rocket's own, from organisation settings, not code.
- Same backup, digest pin, smoke test and rollback. Test envelopes go to Daniel's own addresses only.

## Decided overnight by sign-templates-3 (Daniel can reverse)
- Backups sit beside the compose file with a dated `-pre-pr-image` suffix; the existing `-pre-oidc` copies are never overwritten.
- Roll back by compose copy first; a database restore only with Daniel's go.
- The app image is pinned by digest after the pull, as well as by the `v...-pr.n` tag.
