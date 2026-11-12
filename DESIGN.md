# DESIGN.md: Paper Rocket signing templates (PAP-1441)

Revision 3, 13 Nov 2026: letterhead header, no signature line in email, new footer, compatibility rules. Revision 2: designed dark mode and a premium pass. Covers every email and the certificate and audit pages in `packages/pr-templates`. The app screens stay stock Documenso for now. Research: `docs/research/templates.md`.

## Concept
**Simple but stunning.** (Daniel, 12 Nov 2026)

What that means here: each email is a letter from the business. Its logo is a proper **letterhead**, there is one clear action and a finished footer. The certificate shows each signature sitting on a plain line with the name under it, like the execution block of a paper contract (no ×; the email has no signature line at all).

## Adjectives
Calm, exact, trustworthy, local, quiet.

## Anti-list (what it must never feel like)
SaaS marketing, a newsletter, a bank's fraud warning, a template with a stock illustration, "AI made this".

## Brand slots (the only per-client inputs; all from organisation settings)
| Slot | Setting | Used for |
|---|---|---|
| Logo | `brandingLogo` | centred letterhead band of every email (sized by shape, see Logo sizing); top left of the certificate |
| Primary colour | `brandingColors.primary` | 4px top stripe, button fill, message rule, the certificate's header rule and signed dot |
| Name | organisation name | sender line, footer, logo alt text, fallback wordmark when there's no logo |
| Business details | `brandingCompanyDetails` | footer of emails and certificate |
| Site URL | `NEXT_PUBLIC_WEBAPP_URL` | fallback link, certificate verify link |

No logo set: the name is set as a wordmark (system bold, 19px). No colour set: `#141414`.
Pale primary (contrast under 4.5:1 with white text): the button text flips to `#141414`; if that also fails, the fill is darkened in OKLCH until white passes. Computed at render, tested.

## Tokens
| Token | Value | Role |
|---|---|---|
| `surface` | `#FFFFFF` | every email and PDF surface; never tinted |
| `ink` | `#141414` | text, signature line |
| `ink-2` | `#2A2A28` | message text |
| `muted` | `#5C5C58` | secondary text (6.6:1 on white) |
| `label` | `#6B6B66` | certificate labels (5.4:1) |
| `line` | `#D9D9D4` | 1px borders (mid tone so they survive dark mode) |
| `ok` | `#1F7A4D` | the certificate's completed tick only |
| `alert` | `#B42318` | rejected or cancelled status only |
| `brand` | slot | see brand slots |

Dark, designed (Apple Mail and iOS Mail, `prefers-color-scheme`): page `#000000`, card `#141416` with a 1px `rgba(255,255,255,.06)` edge (no grey line), ink `#F2F2F2`, muted `#A1A1A6`, labels `#7C7C82`, lines `#26262A` and `#3A3A3E`. The brand colour gets a dark partner, `brand-on-dark`, computed by lightening it in OKLCH until it reaches 4.5:1 on the card, with the button text picked by contrast. The logo swaps to a white version with no plate (see Logo on dark).

Gmail and Outlook force their own dark mode and ignore ours. The light design is built to survive it: white surfaces, a filled button with `bgcolor`, and a logo PNG with a white rounded plate (10px radius, 10/14px padding) baked into the image with transparent corners, so Gmail dark shows a deliberate white chip.

## Logo sizing (letterhead)
The header band is a full-width table cell, centred, 44/40/38px padding (32/24/28px on phones), under a 3px brand stripe and over a 1px `#ECECE8` hairline inset 48px. Size comes from the logo's aspect ratio (w/h), computed at render, always written as `width` and `height` attributes plus inline style, from a 2x PNG, alt = business name:
| Shape | Ratio | Email | Certificate |
|---|---|---|---|
| Wide wordmark | 3 or more | width min(264px, 48px x ratio); 232px on phones | width min(232px, 40px x ratio) |
| Stacked | 1.4 to 3 | 64px tall | 56px tall |
| Square | 0.7 to 1.4 | 72px tall | 56px tall |
| Tall | under 0.7 | 80px tall | 64px tall |
Dark (Apple, iOS): a one-colour logo swaps to the derived white version, same box; a logo on its own full-bleed tile shows unchanged; a multi-colour logo on transparent keeps the plate.

## Compatibility rules (email)
Built with React Email (already in Documenso, so no second build system) plus our own button. Checked against Can I Email (data Sept 2026, 15 clients):
- Layout is tables only; no flexbox, grid or positioning.
- No `box-shadow` (7/15, not Gmail, Outlook or Yahoo): edges are 1px borders.
- `border-radius` is decoration only (none in Outlook Windows); the button has an MSO-conditional VML roundrect for Outlook Windows.
- Phone layout is fluid widths; `@media` (2 full, 10 partial) only tidies padding.
- Dark styles via `prefers-color-scheme` reach Apple Mail, iOS Mail, Outlook Mac and the Outlook apps only (6/15); everything else must read in the light version after forced inversion.
- Logos are PNG, never SVG (Gmail partial). Critical styles inline; `<style>` only for dark and phone rules (Gmail 16 KB cap).
- Real-client test list before go-live: Gmail web, iOS and Android (light and dark), Apple Mail, iOS Mail (light and dark), Outlook Windows, new Outlook, Outlook.com, Outlook apps, Yahoo. A paid render service (Litmus or Email on Acid) needs Daniel's go.

**Logo on dark:** still one logo setting. When the logo is a single colour on white or transparent (checked at render), the build derives a white version (luminance to alpha, filled `#F2F2F2`) for the dark rules. A multi-colour logo keeps the soft plate in dark mode too.

## Type
- **Email:** system stack `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`. Small labels 11px semibold uppercase, tracking .07em, `label` colour (one per block, never body text). Document name 28px/1.22 semibold, tracking -0.022em (24px under 480px), body 16px/1.5, small 13px. Nothing under 13px.
- **Certificate (PDF):** Inter (bundled), tabular figures. Title 31px semibold, tracking -0.025em, with a 48px brand rule and a small label above it; labels 8.5 to 9.5px semibold uppercase, tracking .09em, values 10.5 to 12.5px. Ids in JetBrains Mono (OFL, added to the package) at 10px. Signature font Caveat (already bundled) for typed signatures.

## Layout
- **Email:** 600px max, one column, tables, critical styles inline. Card: 14px radius, 1px `#ECECE8` border (`#1E1E21` in designed dark), a 3px brand stripe, body padding 36/48/40px (28/24/30px on phones). Order: letterhead band, hairline, small label ("Document to sign"), document name, who sent it and how long it takes, the sender's message (if any), one button (52px tall, 10px radius, 15px semibold with a quiet arrow), a facts table with one hairline above it, the plain link, then the footer outside the card. No signature line in any email. Under 480px the button is full width.
- **Footer (outside the card, centred under the letterhead):** business name (13px semibold, `#3A3A38`), details (12.5px, `#8A8A85`), a 28px hairline, the "just for you" note (12px, max 400px), then the site link (12px, underlined in `line`). Designed dark: name `#C7C7CC`, text `#6E6E73`, rule `#2C2C30`.
- **Certificate:** A4, about 16mm side margins. Header (logo left, envelope id right), a short brand rule, the "Certificate of completion" label, document title, status line, a borderless 3x2 facts grid under one hairline (envelope id, sent by, pages, sent, completed, time zone), then one block per signer (execution block left: signature on a plain line with no ×, name, email, role and method; timeline right with a fine vertical line and dots, the signed dot filled in the brand colour: sent, opened, signed, then identity, IP, device, signature id), then the footer (QR, verify link, a one-line note on the PDF's digital signature, business details, page x of y). More signers flow to a second page with a small repeated header.

## Times
Every time on the certificate and audit log is in the envelope's time zone (`documentMeta.timezone`, Pacific/Auckland for our sites), printed with the abbreviation (NZDT or NZST), and the zone is stated once in the facts grid. Format `13 Nov 2026, 9:42:18 am NZDT`. Never UTC, never the server zone. Tested across the April and September changeovers.

## Components (allowlist)
Letterhead band, brand stripe, sender line, document name, message block, button (padding plus VML for Outlook Windows), plain link line, facts table, footer, certificate header, status line, facts grid, signer block, verify footer. Nothing else without a revision here.

## Email family
Every email is the same skeleton with different words: invite, reminder, signed (to the sender), completed (to everyone, with the PDF), pending, rejected, rejection confirmed, cancelled, expired, removed, self-signed, direct-template created, bulk-send complete, and the account and organisation emails (confirm, reset, 2FA code, invites, limits). A code email shows the code large in mono instead of a button.

## Words
NZ English, no em dashes, plain and short. Buttons say the action ("Review and sign", "Review and approve", "View document", "Download PDF"). Preheader under 90 characters. Footer: business name, details, "This link is just for you, so please don't forward this email. Not expecting it? Reply and <sender first name> will hear about it." No Documenso credit or address.

## Banned tropes
- Stock or paper illustrations, emoji in subjects, gradients, shadows of any kind in email.
- A signature line or × in an email.
- Tinted backgrounds (Gmail turns them olive), dark ink logos on transparent.
- Centred body text (only the letterhead and footer are centred), ALL CAPS anywhere but the small labels, tracking over .1em, more than one button.
- "Powered by", the Documenso name or address in anything a signer sees.
- Bare UTC times, US date order.
- Dark editorial look, Cormorant Garamond.

## Motion budget
None (email and PDF).

## Rollout rule
Templates live in `packages/pr-templates`. Upstream files only get import swaps, each listed in `PATCHES.md`. CI renders every email and the certificate from fixtures (HTML plus PNG at 390 and 600, light and dark) and fails on an unexpected diff.
