# Documenso email and certificate templates: research (PAP-1441)

Checked 2026-11-12 (Sonnet researcher, written up by documenso-templates). "Inference" means reasoning, not a source. "Unsourced" means standard email craft not verified in this session.

## 1. What Documenso v2.21.1 does today (local checkout)
- Emails are React Email templates in `packages/email/templates/` (31 files), shared parts in `template-components/`. `@documenso/email` uses `react-email ^6.9.0` and `@react-email/render 2.1.0`.
- The invite is a bordered rounded card, `h-6` logo, a document illustration, a centred 18px headline, a `bg-primary` button. Sender line and custom message sit below the card, then an `Hr` and the footer.
- Branding inputs: `useBranding()` gives `brandingLogo`, `brandingUrl`, `brandingCompanyDetails`, `brandingHidePoweredBy`, `brandingColors` (`get-email-context.ts:226`; colours allowed when billing is off).
- Footer says "This document was sent using Documenso" unless hide-powered-by; with branding off it prints the Documenso, Inc. San Francisco address.
- Logo alt text is hard-coded ("Documenso Logo" / "Branding Logo"). No `prefers-color-scheme` handling in the templates.
- Certificate: drawn with Konva on skia-canvas and merged with `@libpdf/core` (`packages/lib/server-only/pdf/render-certificate.ts`, `generate-certificate-pdf.ts`). The older headless Chromium route (`htmltopdf/get-certificate-pdf.ts`) is deprecated. Font Inter (bundled, `apps/remix/public/fonts`), signature font Caveat.
- Certificate times use `toFormat('yyyy-MM-dd hh:mm:ss a (ZZZZ)')` with no `setZone`, so they print in the server zone (UTC in the container). Audit log rows have the same problem while the header prints `documentMeta.timezone`: upstream issue https://github.com/documenso/documenso/issues/3386 (status not checked). Related: #3443, #3453. A fork fixed it: https://github.com/Epic-Group-Software/eg_esign/pull/17.
- Certificate has no logo, no brand colour and no document title; it shows the envelope id and a QR (`qrToken`) and the "provided by Documenso" credit unless `hidePoweredBy`.

## 2. Best-in-class transactional email
- Stripe receipts take a square logo, a brand colour and an accent, and always print the legal business name, support email and address. https://docs.stripe.com/payments/advanced/receipts (read 2026-11-12). Same model as ours: one logo, one colour, business details.
- Linear, DocuSign, Dropbox Sign, Apple, Resend, Vercel: no teardowns reachable this session (reallygoodemails 404, uxdesign 403). Shared traits, as inference: one action, a headline naming sender and document, muted support text, an identity footer.

## 3. Mechanics
- Gmail clips at about 102 KB of HTML; aim under 80 KB. https://www.emailonacid.com/blog/article/email-development/gmail-email-clipping/ (16 Jul 2021)
- Gmail supports class, element and id selectors and min/max-width media queries. https://developers.google.com/workspace/gmail/design/css (undated)
- `<style>` support 78%; Gmail webmail partial (16 KB cap). Inline the critical styles. https://www.caniemail.com/features/html-style/ (27 Jul 2023)
- Preheader under 90 characters, first in the body. https://www.litmus.com/blog/the-ultimate-guide-to-preview-text-support (undated)
- Unsourced craft: 600px table layout; padding button plus a VML roundrect for Outlook Windows; a plain-text part; real alt text; single column stacking about 480px; system font stack (web fonts don't load in Gmail or Outlook); 16px body, line-height 1.5; logos at 2x with width and height; the email must read with images off.

## 4. Dark mode
From https://www.litmus.com/blog/the-ultimate-guide-to-dark-mode-for-email-marketers (27 Feb 2025):

| Client | Treatment | `@media` dark | `[data-ogsc]` |
|---|---|---|---|
| Gmail desktop | none | n/a | n/a |
| Gmail iOS | full invert | no | no |
| Gmail Android | partial invert | no | no |
| Outlook.com, Outlook apps | partial invert | no | partial |
| Outlook Windows 2021/365 | full invert | no | no |
| Apple Mail, iOS Mail | none, `prefers-color-scheme` works | yes | no |

- Avoid pure `#000` on `#fff`. Use near-white and set an explicit background on every container. Pale hairlines disappear in dark mode, so borders need a mid tone. Logos: opaque plate or halo, never dark ink on transparent; the default logo must work unchanged because Gmail and Outlook Windows never see dark styles. https://www.courier.com/blog/dark-mode-email-design (21 Aug 2026)
- Our own test (12 Nov 2026): tinted backgrounds went olive in Gmail dark and a dark logo vanished; white surfaces and a plated logo fixed it. Agrees with the above.
- Inference: the brand colour is client-chosen, so the button text colour must be picked by contrast, and pale primaries must be darkened for fills.

## 5. Certificate
- DocuSign Certificate of Completion: signer names, signature, IP, location if given, chain of custody, timestamps; envelope id is the permanent reference. https://docusign.utexas.edu/verifying-signatures (read 2026-11-12)
- Adobe Acrobat Sign audit report: transaction id, all times in GMT, IP optional. https://helpx.adobe.com/sign/fedramp/user/download-audit-report.html (undated)
- What a signer or lawyer checks (inference): who (name, email), what (document name and id), when (zoned time), how (auth method), from where (IP), plus a way to verify.
- NZ: Part 4 of the Contract and Commercial Law Act 2017 allows electronic signatures that identify the person, indicate approval and are as reliable as appropriate. Secondary sources only (legislation.govt.nz returned 403): https://www.mcveaghfleming.co.nz/articles/electronic-signing-of-contracts, https://jacksonrussell.co.nz/INSIGHTS/x_post/Entering-contracts-in-the-digital-age-00090.html. The certificate makes no legal claims.
- PDF craft (unsourced): A4, 20 to 25 mm margins, a type scale around 9/10/12/18/24 pt, tabular numerals for times, monospace for ids, breakable long strings.

## 6. Still unknown
- Real screenshots of the reference emails.
- Whether react-email's `Button` emits Outlook-safe markup (we will write our own button).
- Status of #3386 upstream.
- Whether the certificate can carry a document hash (none in v2.21.1).

## 7. Rules we take
1. One column, 600px max, tables, critical styles inline.
2. One action per email: one button, a plain link under it.
3. Per-client inputs are only logo, one primary colour, name and business details.
4. White surfaces, ink `#141414` text. Never tint the page or card with the brand colour.
5. Brand colour only on the button, one rule and the top stripe. Button text by contrast, at least 4.5:1; pale primaries are darkened.
6. Logo on its own white plate, width and height set, 2x source, alt text = the business name.
7. Separators are 1px mid-tone borders, no shadows.
8. Preheader under 90 characters, first in the body. Always a plain-text part. HTML under 80 KB, UTF-8.
9. Headline names sender and document. Body 16px, line-height 1.5; nothing under 13px.
10. System font stack in email; Inter in the PDF.
11. Footer carries the business name and details and a "not expecting this?" line. No Documenso address or credit.
12. Padding button with a VML fallback for Outlook Windows.
13. Test Gmail iOS/Android and Outlook Windows first; they are the ones that change the email.
14. Certificate times in Pacific/Auckland (the envelope's zone) with NZDT or NZST printed, the zone stated once in the header.
15. Certificate shows document name, envelope id, a verify QR and link, and each signer's name, email, role, auth method, signature, IP, device and times.
16. Ids monospace, times tabular, long strings break.
17. A4, the same single brand colour as the emails, white page, logo top left.
18. Test certificates across a daylight saving change.
