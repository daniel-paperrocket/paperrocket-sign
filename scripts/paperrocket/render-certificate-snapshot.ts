// paperrocket-sign: renders a fixture certificate and audit log (made-up NZ data) to PDF and PNG.
// Run from CI after `npm ci`. Fonts are read from apps/remix/public/fonts, so the working
// directory is switched to apps/remix for the duration of the render.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PDF } from '@libpdf/core';
import { i18n } from '@lingui/core';
import { DocumentStatus, RecipientRole, SigningStatus } from '@prisma/client';

import { renderAuditLogs } from '../../packages/lib/server-only/pdf/render-audit-logs';
import type { CertificateRecipient } from '../../packages/lib/server-only/pdf/render-certificate';
import { renderCertificate } from '../../packages/lib/server-only/pdf/render-certificate';
import type { PdfBranding } from '../../packages/lib/server-only/pdf/paperrocket-pdf-branding';
import type { TDocumentAuditLog } from '../../packages/lib/types/document-audit-logs';
import { svgToPng } from '../../packages/lib/utils/images/svg-to-png';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

// A4 at 72 ppi, the size the seal job passes.
const pageWidth = 595;
const pageHeight = 842;

type FixtureTimes = {
  label: string;
  timeZone: string;
  firstSent: string;
  firstOpened: string;
  firstSigned: string;
  secondSent: string;
  secondOpened: string;
  secondSigned: string;
};

// 13 Nov 2026 is NZDT (UTC+13). 12 Jun 2026 is NZST (UTC+12).
const fixtures: FixtureTimes[] = [
  {
    label: 'nzdt',
    timeZone: 'Pacific/Auckland',
    firstSent: '2026-11-12T20:12:03Z',
    firstOpened: '2026-11-12T20:40:51Z',
    firstSigned: '2026-11-12T20:42:18Z',
    secondSent: '2026-11-12T20:42:20Z',
    secondOpened: '2026-11-12T21:39:02Z',
    secondSigned: '2026-11-12T21:41:37Z',
  },
  {
    label: 'nzst',
    timeZone: 'Pacific/Auckland',
    firstSent: '2026-06-11T21:12:03Z',
    firstOpened: '2026-06-11T21:40:51Z',
    firstSigned: '2026-06-11T21:42:18Z',
    secondSent: '2026-06-11T21:42:20Z',
    secondOpened: '2026-06-11T22:39:02Z',
    secondSigned: '2026-06-11T22:41:37Z',
  },
];

const iphoneUserAgent =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1';
const windowsUserAgent =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0';

const buildLogo = async () =>
  new Uint8Array(
    await svgToPng(
      `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="240" viewBox="0 0 600 120">
        <rect x="4" y="20" width="80" height="80" rx="14" fill="#0F5C8C"/>
        <path d="M24 78 L44 38 L64 78 Z" fill="#fff"/>
        <text x="104" y="76" font-family="Arial, Helvetica, sans-serif" font-size="46" font-weight="700" fill="#10263A">Example Consulting</text>
      </svg>`,
    ),
  );

const buildDrawnSignature = async () => {
  const png = await svgToPng(
    `<svg xmlns="http://www.w3.org/2000/svg" width="660" height="180" viewBox="0 0 220 60">
      <path d="M6 44c10-22 22-36 28-30s-14 34-6 34 18-30 26-28-6 22 2 22 14-16 22-18c6-1 2 12 10 12s16-14 26-14 4 10 14 8 20-10 34-12 20 0 30-2" fill="none" stroke="#1B2740" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  );

  return `data:image/png;base64,${Buffer.from(png).toString('base64')}`;
};

const buildRecipients = (times: FixtureTimes, drawnSignature: string): CertificateRecipient[] => {
  const log = (date: string, ipAddress: string, userAgent: string) => ({
    createdAt: new Date(date),
    ipAddress,
    userAgent,
  });

  return [
    {
      id: 1,
      name: 'Sam Taylor',
      email: 'sam.taylor@example.co.nz',
      role: RecipientRole.SIGNER,
      rejectionReason: null,
      signingStatus: SigningStatus.SIGNED,
      signatureField: {
        id: 1,
        secondaryId: 'sig_4c1e9b20a7d3',
        recipientId: 1,
        signature: { signatureImageAsBase64: drawnSignature, typedSignature: null },
      },
      authLevel: 'Email',
      logs: {
        emailed: log(times.firstSent, '203.0.113.10', ''),
        sent: null,
        opened: log(times.firstOpened, '203.0.113.24', iphoneUserAgent),
        completed: log(times.firstSigned, '203.0.113.24', iphoneUserAgent),
        rejected: null,
      },
    },
    {
      id: 2,
      name: 'Kim Walker',
      email: 'kim@example.co.nz',
      role: RecipientRole.SIGNER,
      rejectionReason: null,
      signingStatus: SigningStatus.SIGNED,
      signatureField: {
        id: 2,
        secondaryId: 'sig_91af0e66b2c8',
        recipientId: 2,
        signature: { signatureImageAsBase64: '', typedSignature: 'Kim Walker' },
      },
      authLevel: 'Account Authentication',
      logs: {
        emailed: log(times.secondSent, '198.51.100.3', ''),
        sent: null,
        opened: log(times.secondOpened, '198.51.100.7', windowsUserAgent),
        completed: log(times.secondSigned, '198.51.100.7', windowsUserAgent),
        rejected: null,
      },
    },
  ];
};

const buildAuditLogs = (times: FixtureTimes, envelopeId: string): TDocumentAuditLog[] => {
  const base = (date: string, email: string | null, ipAddress: string | null, userAgent: string | null) => ({
    id: '',
    envelopeId,
    createdAt: new Date(date),
    email,
    name: null,
    userId: null,
    ipAddress,
    userAgent,
  });

  const recipientData = (name: string, email: string, id: number) => ({
    recipientEmail: email,
    recipientName: name,
    recipientId: id,
    recipientRole: 'SIGNER',
  });

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const logs = [
    {
      ...base(times.secondSigned, 'kim@example.co.nz', '198.51.100.7', windowsUserAgent),
      type: 'DOCUMENT_COMPLETED',
      data: { transactionId: 'txn_demo_0004' },
    },
    {
      ...base(times.secondSigned, 'kim@example.co.nz', '198.51.100.7', windowsUserAgent),
      type: 'DOCUMENT_RECIPIENT_COMPLETED',
      data: { ...recipientData('Kim Walker', 'kim@example.co.nz', 2), actionAuth: [] },
    },
    {
      ...base(times.secondOpened, 'kim@example.co.nz', '198.51.100.7', windowsUserAgent),
      type: 'DOCUMENT_OPENED',
      data: { ...recipientData('Kim Walker', 'kim@example.co.nz', 2), accessAuth: [] },
    },
    {
      ...base(times.firstSigned, 'sam.taylor@example.co.nz', '203.0.113.24', iphoneUserAgent),
      type: 'DOCUMENT_RECIPIENT_COMPLETED',
      data: { ...recipientData('Sam Taylor', 'sam.taylor@example.co.nz', 1), actionAuth: [] },
    },
    {
      ...base(times.firstOpened, 'sam.taylor@example.co.nz', '203.0.113.24', iphoneUserAgent),
      type: 'DOCUMENT_OPENED',
      data: { ...recipientData('Sam Taylor', 'sam.taylor@example.co.nz', 1), accessAuth: [] },
    },
    {
      ...base(times.firstSent, 'owner@example.co.nz', '203.0.113.10', windowsUserAgent),
      type: 'DOCUMENT_SENT',
      data: {},
    },
    {
      ...base(times.firstSent, 'owner@example.co.nz', '203.0.113.10', windowsUserAgent),
      type: 'DOCUMENT_CREATED',
      data: { title: 'Consultancy agreement, Lakeview Terrace' },
    },
  ] as unknown as TDocumentAuditLog[];

  // Repeat the opens so the audit log runs onto a second and third page.
  const extra = Array.from({ length: 12 }, (_, index) => ({
    ...logs[4],
    createdAt: new Date(new Date(times.firstOpened).getTime() - (index + 1) * 60_000),
  })) as TDocumentAuditLog[];

  return [...logs, ...extra];
};

const writePages = async (outDir: string, name: string, pdfPages: Uint8Array[], pngPages: Uint8Array[]) => {
  const merged = await PDF.merge(pdfPages);

  fs.writeFileSync(path.join(outDir, `${name}.pdf`), await merged.save());

  for (const [index, page] of pngPages.entries()) {
    fs.writeFileSync(path.join(outDir, `${name}-page-${index + 1}.png`), page);
  }
};

export default async (outDir: string): Promise<void> => {
  fs.mkdirSync(outDir, { recursive: true });

  const absoluteOutDir = path.resolve(outDir);
  const originalCwd = process.cwd();

  // ensureFontLibrary reads fonts from <cwd>/public/fonts.
  process.chdir(path.join(repoRoot, 'apps/remix'));
  process.env.NEXT_PUBLIC_WEBAPP_URL = 'https://sign.example.co.nz';

  try {
    i18n.loadAndActivate({ locale: 'en', messages: {} });

    const branding: PdfBranding = {
      businessName: 'Example Consulting',
      primaryColor: '#0F5C8C',
      logo: await buildLogo(),
      companyDetails: 'Example Consulting Ltd\nProject management and advice\nWānaka\n03 555 0100',
    };

    const drawnSignature = await buildDrawnSignature();

    for (const times of fixtures) {
      const envelopeId = `envelope_${times.label}7Qm2kXr9TfLp`;
      const title = 'Consultancy agreement, Lakeview Terrace';
      const recipients = buildRecipients(times, drawnSignature);

      const certificateOptions = {
        recipients,
        envelopeId,
        title,
        qrToken: 'demoToken7Qm2kXr9',
        i18n,
        envelopeOwner: { name: 'Pat Owner', email: 'owner@example.co.nz' },
        timeZone: times.timeZone,
        signingOrder: 'SEQUENTIAL' as const,
        branding,
        pageWidth,
        pageHeight,
      };

      await writePages(
        absoluteOutDir,
        `certificate-${times.label}`,
        await renderCertificate({ ...certificateOptions, format: 'pdf' }),
        await renderCertificate({ ...certificateOptions, format: 'png' }),
      );

      const auditOptions = {
        envelope: {
          id: envelopeId,
          title,
          status: DocumentStatus.COMPLETED,
          createdAt: new Date(times.firstSent),
          updatedAt: new Date(times.secondSigned),
          deletedAt: null,
          documentMeta: { timezone: times.timeZone },
        } as unknown as Parameters<typeof renderAuditLogs>[0]['envelope'],
        envelopeItems: ['Consultancy agreement.pdf'],
        recipients: recipients.map((recipient) => ({
          id: recipient.id,
          name: recipient.name,
          email: recipient.email,
          role: recipient.role,
        })),
        auditLogs: buildAuditLogs(times, envelopeId),
        envelopeOwner: { name: 'Pat Owner', email: 'owner@example.co.nz' },
        branding,
        i18n,
        pageWidth,
        pageHeight,
      };

      await writePages(
        absoluteOutDir,
        `audit-log-${times.label}`,
        await renderAuditLogs({ ...auditOptions, format: 'pdf' }),
        await renderAuditLogs({ ...auditOptions, format: 'png' }),
      );
    }

    // Six signers, to show the continuation page and its repeated header.
    const manyRecipients = Array.from({ length: 6 }, (_, index) => ({
      ...buildRecipients(fixtures[0], drawnSignature)[index % 2],
      id: index + 1,
      name: `Signer ${index + 1} Example`,
      email: `signer${index + 1}@example.co.nz`,
    }));

    const manyOptions = {
      recipients: manyRecipients,
      envelopeId: 'envelope_many7Qm2kXr9TfLp',
      title: 'Consultancy agreement, Lakeview Terrace',
      qrToken: 'demoToken7Qm2kXr9',
      i18n,
      envelopeOwner: { name: 'Pat Owner', email: 'owner@example.co.nz' },
      timeZone: 'Pacific/Auckland',
      signingOrder: 'PARALLEL' as const,
      branding,
      pageWidth,
      pageHeight,
    };

    await writePages(
      absoluteOutDir,
      'certificate-many-signers',
      await renderCertificate({ ...manyOptions, format: 'pdf' }),
      await renderCertificate({ ...manyOptions, format: 'png' }),
    );
  } finally {
    process.chdir(originalCwd);
  }
};
