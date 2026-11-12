// sort-imports-ignore
import '../konva/skia-backend';

import type { Canvas } from '@documenso/skia-canvas';
import type { I18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import type { DocumentMeta, Envelope, RecipientRole } from '@prisma/client';
import Konva from 'konva';
import { match, P } from 'ts-pattern';
import { UAParser } from 'ua-parser-js';

import { DOCUMENT_STATUS } from '../../constants/document';
import { RECIPIENT_ROLES_DESCRIPTION } from '../../constants/recipient-roles';
import type { TDocumentAuditLog } from '../../types/document-audit-logs';
import { DOCUMENT_AUDIT_LOG_TYPE } from '../../types/document-audit-logs';
import { formatDocumentAuditLogAction } from '../../utils/document-audit-logs';
import { formatZoneStatement, formatZonedDateTime, resolvePdfTimeZone } from './format-zoned-time';
import { ensureFontLibrary } from './helpers';
import type { PdfBranding } from './paperrocket-pdf-branding';
import { DEFAULT_PDF_BRANDING } from './paperrocket-pdf-branding';
import {
  PDF_DESIGN_WIDTH,
  createHairline,
  createLabel,
  createMono,
  createPageBackground,
  createText,
  loadLogoImage,
  pdfColors,
  pdfLayout,
  renderLetterhead,
} from './paperrocket-pdf-kit';

export type AuditLogRecipient = {
  id: number;
  name: string;
  email: string;
  role: RecipientRole;
};

type GenerateAuditLogsOptions = {
  envelope: Omit<Envelope, 'completedAt'> & {
    documentMeta: DocumentMeta;
  };
  envelopeItems: string[];
  recipients: AuditLogRecipient[];
  auditLogs: TDocumentAuditLog[];
  /** Ignored: the "provided by" credit is never drawn. */
  hidePoweredBy?: boolean;
  branding?: PdfBranding;
  pageWidth: number;
  pageHeight: number;
  i18n: I18n;
  envelopeOwner: {
    email: string;
    name: string;
  };
  /** Defaults to 'pdf'. 'png' is used by the snapshot script. */
  format?: 'pdf' | 'png';
};

const parser = new UAParser();

const footerHeight = 36;
const footerGapAbove = 24;
const rowPaddingTop = 18;
const rowPaddingBottom = 18;

type Block = {
  group: Konva.Group;
  height: number;
};

type RenderOverviewOptions = {
  envelope: GenerateAuditLogsOptions['envelope'];
  envelopeItems: string[];
  envelopeOwner: GenerateAuditLogsOptions['envelopeOwner'];
  recipients: AuditLogRecipient[];
  zone: string;
  i18n: I18n;
};

const renderOverview = (options: RenderOverviewOptions): Block => {
  const { envelope, envelopeItems, envelopeOwner, recipients, zone, i18n } = options;

  const group = new Konva.Group();
  group.add(createHairline(0));

  const columnGap = 28;
  const usable = pdfLayout.contentWidth - columnGap * 2;
  const columnWidths = [(usable * 1.25) / 3.25, usable / 3.25, usable / 3.25];
  const columnXs = [0, columnWidths[0] + columnGap, columnWidths[0] + columnWidths[1] + columnGap * 2];

  const facts: { label: string; value: string; mono?: boolean }[] = [
    { label: i18n._(msg`Owner`), value: `${envelopeOwner.name} (${envelopeOwner.email})` },
    {
      label: i18n._(msg`Status`),
      value: i18n._(envelope.deletedAt ? msg`Deleted` : DOCUMENT_STATUS[envelope.status].description),
    },
    { label: i18n._(msg`Time zone`), value: formatZoneStatement(envelope.updatedAt, zone) },
    { label: i18n._(msg`Envelope ID`), value: envelope.id, mono: true },
    { label: i18n._(msg`Created`), value: formatZonedDateTime(envelope.createdAt, zone) },
    { label: i18n._(msg`Last updated`), value: formatZonedDateTime(envelope.updatedAt, zone) },
  ];

  let y = 20;

  for (let rowStart = 0; rowStart < facts.length; rowStart += 3) {
    let rowHeight = 0;

    for (const [column, fact] of facts.slice(rowStart, rowStart + 3).entries()) {
      const label = createLabel(fact.label, { x: columnXs[column], y, width: columnWidths[column] });
      const valueConfig = {
        x: columnXs[column],
        y: y + label.height() + 5,
        width: columnWidths[column],
        text: fact.value,
        wrap: 'char' as const,
      };

      const value = fact.mono
        ? createMono({ ...valueConfig, fontSize: 10.5 })
        : createText({ ...valueConfig, fontSize: 11, fontStyle: '500' });

      group.add(label);
      group.add(value);

      rowHeight = Math.max(rowHeight, label.height() + 5 + value.height());
    }

    y += rowHeight + 18;
  }

  // Lists: enclosed documents and recipients.
  const listWidth = (pdfLayout.contentWidth - columnGap) / 2;
  const lists = [
    { label: i18n._(msg`Enclosed documents`), items: envelopeItems, x: 0 },
    {
      label: i18n._(msg`Recipients`),
      items: recipients.map(
        (recipient) =>
          `[${i18n._(RECIPIENT_ROLES_DESCRIPTION[recipient.role].roleName)}] ${recipient.name} (${recipient.email})`,
      ),
      x: listWidth + columnGap,
    },
  ];

  let listsHeight = 0;

  for (const list of lists) {
    const label = createLabel(list.label, { x: list.x, y, width: listWidth });
    group.add(label);

    let listY = y + label.height() + 5;

    for (const item of list.items) {
      const text = createText({
        x: list.x,
        y: listY,
        width: listWidth,
        text: item,
        fontSize: 10,
        fill: pdfColors.ink2,
        wrap: 'char',
      });

      group.add(text);
      listY += text.height() + 3;
    }

    listsHeight = Math.max(listsHeight, listY - y);
  }

  y += listsHeight + 36;

  return { group, height: y };
};

const getIndicatorColor = (type: string, primaryColor: string) =>
  match(type)
    .with(DOCUMENT_AUDIT_LOG_TYPE.DOCUMENT_RECIPIENT_COMPLETED, () => pdfColors.ok)
    .with(DOCUMENT_AUDIT_LOG_TYPE.DOCUMENT_RECIPIENT_REJECTED, () => pdfColors.alert)
    .with(
      P.union(DOCUMENT_AUDIT_LOG_TYPE.DOCUMENT_SENT, DOCUMENT_AUDIT_LOG_TYPE.DOCUMENT_COMPLETED),
      () => primaryColor,
    )
    .otherwise(() => pdfColors.lineStrong);

const formatUserAgent = (userAgent: string | null | undefined, userAgentInfo: UAParser.IResult, i18n: I18n) => {
  if (!userAgent) {
    return i18n._(msg`N/A`);
  }

  const browser = userAgentInfo.browser.name;
  const version = userAgentInfo.browser.version;
  const os = userAgentInfo.os.name;

  if (browser && os) {
    const browserInfo = version ? `${browser} ${version}` : browser;

    return i18n._(msg`${browserInfo} on ${os}`);
  }

  return userAgent;
};

type RenderRowOptions = {
  auditLog: TDocumentAuditLog;
  zone: string;
  primaryColor: string;
  i18n: I18n;
};

const renderRow = (options: RenderRowOptions): Block => {
  const { auditLog, zone, primaryColor, i18n } = options;

  const group = new Konva.Group();
  group.add(createHairline(0));

  const half = (pdfLayout.contentWidth - 28) / 2;
  let y = rowPaddingTop;

  group.add(
    new Konva.Circle({
      x: 3.5,
      y: y + 6,
      radius: 3.5,
      fill: getIndicatorColor(auditLog.type, primaryColor),
    }),
  );

  const typeLabel = createLabel(auditLog.type.replace(/_/g, ' '), { x: 16, y, width: half - 16, wrap: 'char' });
  group.add(typeLabel);

  const timestamp = createText({
    x: half + 28,
    y: y - 1,
    width: half,
    align: 'right',
    text: formatZonedDateTime(auditLog.createdAt, zone),
    fontSize: 10,
    fill: pdfColors.muted,
    lineHeight: 1.45,
  });
  group.add(timestamp);

  y += Math.max(typeLabel.height(), timestamp.height() - 1) + 5;

  const description = createText({
    x: 16,
    y,
    width: pdfLayout.contentWidth - 16,
    text: formatDocumentAuditLogAction(i18n, auditLog).description,
    fontSize: 10.5,
    wrap: 'word',
  });
  group.add(description);

  y += description.height() + 12;

  parser.setUA(auditLog.userAgent || '');
  const userAgentInfo = parser.getResult();

  const cells = [
    { label: i18n._(msg`User`), value: auditLog.email || i18n._(msg`N/A`), mono: true, x: 16, width: half - 16 },
    { label: i18n._(msg`IP address`), value: auditLog.ipAddress || i18n._(msg`N/A`), mono: true, x: half + 28, width: half },
  ];

  let cellsHeight = 0;

  for (const cell of cells) {
    const label = createLabel(cell.label, { x: cell.x, y, width: cell.width, size: 8 });
    const value = createMono({ x: cell.x, y: y + label.height() + 3, width: cell.width, text: cell.value, fontSize: 9, wrap: 'char' });

    group.add(label);
    group.add(value);

    cellsHeight = Math.max(cellsHeight, label.height() + 3 + value.height());
  }

  y += cellsHeight + 9;

  const agentLabel = createLabel(i18n._(msg`User agent`), { x: 16, y, width: pdfLayout.contentWidth - 16, size: 8 });
  const agentValue = createText({
    x: 16,
    y: y + agentLabel.height() + 3,
    width: pdfLayout.contentWidth - 16,
    text: formatUserAgent(auditLog.userAgent, userAgentInfo, i18n),
    fontSize: 9,
    fill: pdfColors.ink2,
    wrap: 'char',
  });

  group.add(agentLabel);
  group.add(agentValue);

  y += agentLabel.height() + 3 + agentValue.height();

  return { group, height: y + rowPaddingBottom };
};

const renderFooter = (options: {
  branding: PdfBranding;
  envelopeId: string;
  pageNumber: number;
  pageCount: number;
  designHeight: number;
  i18n: I18n;
}) => {
  const { branding, envelopeId, pageNumber, pageCount, designHeight, i18n } = options;

  const group = new Konva.Group({ x: pdfLayout.marginX, y: designHeight - pdfLayout.bottom - footerHeight });
  group.add(createHairline(0));

  const pageText = createText({
    text: i18n._(msg`Page ${pageNumber} of ${pageCount}`),
    fontSize: 9,
    fill: pdfColors.label,
    lineHeight: 1.55,
    wrap: 'none',
  });

  pageText.setAttrs({ x: pdfLayout.contentWidth - pageText.width(), y: 20 });
  group.add(pageText);

  const details = branding.companyDetails
    ? branding.companyDetails
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .join(' · ')
    : branding.businessName;

  const left = createText({
    x: 0,
    y: 20,
    width: pdfLayout.contentWidth - pageText.width() - 20,
    height: 9 * 1.55,
    text: details || `${i18n._(msg`Envelope ID`)}: ${envelopeId}`,
    fontSize: 9,
    fill: pdfColors.label,
    lineHeight: 1.55,
    wrap: 'none',
    ellipsis: true,
  });
  group.add(left);

  return group;
};

export async function renderAuditLogs({
  envelope,
  envelopeOwner,
  envelopeItems,
  recipients,
  auditLogs,
  pageWidth,
  pageHeight,
  i18n,
  branding = DEFAULT_PDF_BRANDING,
  format = 'pdf',
}: GenerateAuditLogsOptions) {
  ensureFontLibrary();

  const scale = pageWidth / PDF_DESIGN_WIDTH;
  const designHeight = pageHeight / scale;
  const zone = resolvePdfTimeZone(envelope.documentMeta?.timezone);

  const logoImage = loadLogoImage(branding.logo);

  const limit = designHeight - pdfLayout.bottom - footerHeight - footerGapAbove;

  const buildFirstHeader = () => {
    const group = new Konva.Group();

    const letterhead = renderLetterhead({
      branding,
      logoImage,
      envelopeId: envelope.id,
      envelopeLabel: i18n._(msg`Envelope`),
    });
    group.add(letterhead.group);

    let y = pdfLayout.top + Math.max(letterhead.height, 32) + 52;

    group.add(new Konva.Rect({ x: pdfLayout.marginX, y, width: 48, height: 1.5, fill: branding.primaryColor }));
    y += 1.5 + 20;

    const eyebrow = createLabel(i18n._(msg`Audit log`), { x: pdfLayout.marginX, y, size: 9.5 });
    group.add(eyebrow);
    y += eyebrow.height() + 10;

    const title = createText({
      x: pdfLayout.marginX,
      y,
      width: 640,
      text: envelope.title,
      fontSize: 31,
      fontStyle: '600',
      letterSpacing: -0.775,
      lineHeight: 1.14,
      wrap: 'word',
    });
    group.add(title);
    y += title.height() + 36;

    return { group, bottom: y };
  };

  const buildContinuationHeader = () => {
    const group = new Konva.Group();

    const letterhead = renderLetterhead({
      branding,
      logoImage,
      envelopeId: envelope.id,
      envelopeLabel: i18n._(msg`Audit log`),
      compact: true,
    });
    group.add(letterhead.group);

    const ruleY = pdfLayout.top + Math.max(letterhead.height, 32) + 18;
    group.add(createHairline(ruleY, { x: pdfLayout.marginX }));

    return { group, bottom: ruleY + 20 };
  };

  const overview = renderOverview({ envelope, envelopeItems, envelopeOwner, recipients, zone, i18n });

  const rows = auditLogs.map((auditLog) =>
    renderRow({ auditLog, zone, primaryColor: branding.primaryColor, i18n }),
  );

  const firstHeader = buildFirstHeader();
  const firstStart = firstHeader.bottom + overview.height;
  const continuationStart = buildContinuationHeader().bottom;

  const pageRows: Block[][] = [[]];
  let cursor = firstStart;

  for (const row of rows) {
    const current = pageRows[pageRows.length - 1];

    if (current.length > 0 && cursor + row.height > limit) {
      pageRows.push([row]);
      cursor = continuationStart + row.height;
    } else {
      current.push(row);
      cursor += row.height;
    }
  }

  const pageCount = pageRows.length;
  const pages: Uint8Array[] = [];

  let stage: Konva.Stage | null = new Konva.Stage({ width: pageWidth, height: pageHeight });

  for (const [pageIndex, blocks] of pageRows.entries()) {
    stage.destroyChildren();

    const layer = new Konva.Layer();
    const content = new Konva.Group({ scaleX: scale, scaleY: scale });

    content.add(createPageBackground(PDF_DESIGN_WIDTH, designHeight));

    let y: number;

    if (pageIndex === 0) {
      content.add(firstHeader.group);

      overview.group.setAttrs({ x: pdfLayout.marginX, y: firstHeader.bottom });
      content.add(overview.group);

      y = firstStart;
    } else {
      const continuation = buildContinuationHeader();
      content.add(continuation.group);

      y = continuationStart;
    }

    for (const block of blocks) {
      block.group.setAttrs({ x: pdfLayout.marginX, y });
      content.add(block.group);
      y += block.height;
    }

    if (blocks.length > 0) {
      content.add(createHairline(y, { x: pdfLayout.marginX }));
    }

    content.add(
      renderFooter({ branding, envelopeId: envelope.id, pageNumber: pageIndex + 1, pageCount, designHeight, i18n }),
    );

    layer.add(content);
    stage.add(layer);

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const canvas = layer.canvas._canvas as unknown as Canvas;
    const buffer = await canvas.toBuffer(format);

    pages.push(new Uint8Array(buffer));
  }

  stage.destroy();
  stage = null;

  return pages;
}
