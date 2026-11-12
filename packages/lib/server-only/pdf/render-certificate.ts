// sort-imports-ignore
import '../konva/skia-backend';

import type { Canvas } from '@documenso/skia-canvas';
import { Image as SkiaImage } from '@documenso/skia-canvas';
import type { I18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import type { Field, RecipientRole, Signature } from '@prisma/client';
import { RecipientRole as RecipientRoleEnum, SigningStatus } from '@prisma/client';
import Konva from 'konva';
import { UAParser } from 'ua-parser-js';
import { renderSVG } from 'uqr';

import { NEXT_PUBLIC_WEBAPP_URL } from '../../constants/app';
import { getSignatureFontFamily } from '../../constants/pdf';
import { RECIPIENT_ROLES_DESCRIPTION } from '../../constants/recipient-roles';
import type { TDocumentAuditLogBaseSchema } from '../../types/document-audit-logs';
import { svgToPng } from '../../utils/images/svg-to-png';
import { formatZoneStatement, formatZonedDateTime, formatZonedDateTimeLong, resolvePdfTimeZone } from './format-zoned-time';
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

type BaseAuditLog = Pick<TDocumentAuditLogBaseSchema, 'createdAt' | 'ipAddress' | 'userAgent'>;

export type CertificateRecipient = {
  id: number;
  name: string;
  email: string;
  role: RecipientRole;
  rejectionReason: string | null;
  signingStatus: SigningStatus;
  signatureField?: Pick<Field, 'id' | 'secondaryId' | 'recipientId'> & {
    signature?: Pick<Signature, 'signatureImageAsBase64' | 'typedSignature'> | null;
  };
  authLevel: string;
  logs: {
    emailed: BaseAuditLog | null;
    sent: BaseAuditLog | null;
    opened: BaseAuditLog | null;
    completed: BaseAuditLog | null;
    rejected: BaseAuditLog | null;
  };
};

type GenerateCertificateOptions = {
  recipients: CertificateRecipient[];
  envelopeId: string;
  /** Document title shown under the "Certificate of completion" label. */
  title?: string;
  qrToken: string | null;
  /** Ignored: the "provided by" credit is never drawn. */
  hidePoweredBy?: boolean;
  i18n: I18n;
  envelopeOwner: {
    name: string;
    email: string;
  };
  /** `documentMeta.timezone`; falls back to Pacific/Auckland. */
  timeZone?: string | null;
  signingOrder?: 'PARALLEL' | 'SEQUENTIAL' | null;
  branding?: PdfBranding;
  pageWidth: number;
  pageHeight: number;
  /** Defaults to 'pdf'. 'png' is used by the snapshot script. */
  format?: 'pdf' | 'png';
};

const signerColumnWidth = 300;
const signerGap = 40;
const rightColumnX = signerColumnWidth + signerGap;
const rightColumnWidth = pdfLayout.contentWidth - rightColumnX;
const footerHeight = 76;
const footerGapAbove = 24;

const getDevice = (userAgent: string | null | undefined, unknown: string): string => {
  if (!userAgent) {
    return unknown;
  }

  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  const osName = result.os.name;
  const osVersion = result.os.version?.split('.')[0];
  const browserName = result.browser.name;
  const browserVersion = result.browser.version?.split('.').slice(0, 2).join('.');

  const os = [osName, osVersion].filter(Boolean).join(' ');
  const browser = [browserName, browserVersion].filter(Boolean).join(' ');

  return [os, browser].filter(Boolean).join(', ') || unknown;
};

type SignerBlock = {
  group: Konva.Group;
  height: number;
};

type RenderSignerBlockOptions = {
  recipient: CertificateRecipient;
  zone: string;
  primaryColor: string;
  i18n: I18n;
};

const renderSignerBlock = (options: RenderSignerBlockOptions): SignerBlock => {
  const { recipient, zone, primaryColor, i18n } = options;

  const unknown = i18n._(msg`Unknown`);
  const isRejected = Boolean(recipient.logs.rejected);

  const group = new Konva.Group();
  group.add(createHairline(0));

  const paddingTop = 30;
  const paddingBottom = 32;

  // Left: execution block.
  const left = new Konva.Group({ x: 0, y: paddingTop });

  const sigBoxHeight = 64;
  const signature = recipient.signatureField?.signature;
  let method: string | null = null;

  if (!isRejected && recipient.signatureField?.secondaryId) {
    if (signature?.signatureImageAsBase64) {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const img = new SkiaImage(signature.signatureImageAsBase64) as unknown as HTMLImageElement;
      const ratio = img.width / img.height;
      const height = Math.min(56, (signerColumnWidth - 4) / ratio);

      left.add(
        new Konva.Image({ image: img, x: 2, y: sigBoxHeight - 4 - height, width: height * ratio, height }),
      );
      method = i18n._(msg`drawn signature`);
    } else if (signature?.typedSignature) {
      const typed = createText({
        x: 2,
        y: 0,
        text: signature.typedSignature,
        fontFamily: getSignatureFontFamily(signature.typedSignature),
        fontSize: 36,
        lineHeight: 1,
        fill: pdfColors.signature,
        fontStyle: '500',
        wrap: 'none',
      });

      if (typed.width() > signerColumnWidth - 4) {
        typed.fontSize((36 * (signerColumnWidth - 4)) / typed.width());
      }

      typed.y(sigBoxHeight - 4 - typed.height());
      left.add(typed);
      method = i18n._(msg`typed signature`);
    }
  }

  left.add(
    new Konva.Line({
      points: [0, sigBoxHeight + 0.5, signerColumnWidth, sigBoxHeight + 0.5],
      stroke: pdfColors.lineStrong,
      strokeWidth: 1,
    }),
  );

  const name = createText({
    x: 0,
    y: sigBoxHeight + 1 + 12,
    width: signerColumnWidth,
    text: recipient.name || recipient.email,
    fontSize: 13.5,
    fontStyle: '600',
    letterSpacing: -0.135,
    lineHeight: 1.35,
    wrap: 'char',
  });
  left.add(name);

  let leftBottom = name.y() + name.height();

  if (recipient.name) {
    const email = createText({
      x: 0,
      y: leftBottom + 2,
      width: signerColumnWidth,
      text: recipient.email,
      fontSize: 10.5,
      fill: pdfColors.muted,
      wrap: 'char',
    });
    left.add(email);
    leftBottom = email.y() + email.height();
  }

  const roleName = i18n._(RECIPIENT_ROLES_DESCRIPTION[recipient.role].roleName);
  const role = createLabel(method ? `${roleName} · ${method}` : roleName, {
    x: 0,
    y: leftBottom + 12,
    width: signerColumnWidth,
    wrap: 'char',
    fill: isRejected ? pdfColors.alert : pdfColors.label,
  });
  left.add(role);
  leftBottom = role.y() + role.height();

  group.add(left);

  // Right: timeline, then details.
  const right = new Konva.Group({ x: rightColumnX, y: paddingTop });

  const sentLog = recipient.logs.emailed ?? recipient.logs.sent;
  const finalLog = isRejected ? recipient.logs.rejected : recipient.logs.completed;

  const timelineItems: { label: string; value: string; isFinal: boolean }[] = [
    { label: i18n._(msg`Sent`), value: sentLog ? formatZonedDateTime(sentLog.createdAt, zone) : unknown, isFinal: false },
    {
      label: i18n._(msg`Opened`),
      value: recipient.logs.opened ? formatZonedDateTime(recipient.logs.opened.createdAt, zone) : unknown,
      isFinal: false,
    },
    {
      label: isRejected ? i18n._(msg`Rejected`) : i18n._(msg`Signed`),
      value: finalLog ? formatZonedDateTime(finalLog.createdAt, zone) : unknown,
      isFinal: true,
    },
  ];

  const rowPitch = 25.5;
  const timelineTop = 2;
  const dotX = 3.5;
  const textX = 14;
  const valueX = textX + 58 + 10;

  const lastDotY = timelineTop + (timelineItems.length - 1) * rowPitch + 8.5;

  right.add(
    new Konva.Line({
      points: [dotX, timelineTop + 8.5, dotX, lastDotY],
      stroke: pdfColors.timeline,
      strokeWidth: 1,
    }),
  );

  let timelineBottom = timelineTop;

  for (const [index, item] of timelineItems.entries()) {
    const y = timelineTop + index * rowPitch;
    const finalColor = isRejected ? pdfColors.alert : pdfColors.ink;

    right.add(
      new Konva.Circle({
        x: dotX,
        y: y + 8.5,
        radius: item.isFinal ? 3.5 : 3,
        fill: item.isFinal ? (isRejected ? pdfColors.alert : primaryColor) : pdfColors.surface,
        stroke: item.isFinal ? undefined : pdfColors.lineStrong,
        strokeWidth: item.isFinal ? 0 : 1,
      }),
    );

    right.add(
      createText({
        x: textX,
        y: y + 1,
        text: item.label,
        fontStyle: '500',
        fill: item.isFinal && isRejected ? pdfColors.alert : pdfColors.label,
        lineHeight: 1.5,
      }),
    );

    const value = createText({
      x: valueX,
      y: y + 1,
      width: rightColumnWidth - valueX,
      text: item.value,
      fontStyle: item.isFinal ? '600' : 'normal',
      fill: item.isFinal ? finalColor : pdfColors.ink,
      lineHeight: 1.5,
    });
    right.add(value);

    timelineBottom = Math.max(timelineBottom, value.y() + value.height());
  }

  const relevantLog = isRejected ? recipient.logs.rejected : recipient.logs.completed;

  const metaRows: { label: string; value: string; mono?: boolean; fill?: string }[] = [
    { label: i18n._(msg`Identity`), value: recipient.authLevel },
    { label: i18n._(msg`IP address`), value: relevantLog?.ipAddress || unknown },
    { label: i18n._(msg`Device`), value: getDevice(relevantLog?.userAgent, unknown) },
  ];

  if (isRejected) {
    metaRows.push({ label: i18n._(msg`Reason`), value: recipient.rejectionReason || unknown, fill: pdfColors.alert });
  } else {
    metaRows.push({
      label: i18n._(msg`Signature ID`),
      value: recipient.signatureField?.secondaryId ?? i18n._(msg`N/A`),
      mono: Boolean(recipient.signatureField?.secondaryId),
    });
  }

  const metaX = 14;
  const metaLabelWidth = 72;
  const metaValueX = metaX + metaLabelWidth + 10;
  let metaY = timelineBottom + 20;

  for (const row of metaRows) {
    const label = createText({
      x: metaX,
      y: metaY,
      width: metaLabelWidth,
      text: row.label,
      fontSize: 9.5,
      lineHeight: 1.45,
      fill: pdfColors.label,
    });

    const valueConfig = {
      x: metaValueX,
      y: metaY,
      width: rightColumnWidth - metaValueX,
      text: row.value,
      wrap: 'char' as const,
    };

    const value = row.mono
      ? createMono({ ...valueConfig, fontSize: 10, lineHeight: 1.4 })
      : createText({ ...valueConfig, fontSize: 9.5, lineHeight: 1.45, fill: row.fill ?? pdfColors.ink2 });

    right.add(label);
    right.add(value);

    metaY += Math.max(label.height(), value.height()) + 5;
  }

  const rightBottom = metaY - 5;

  group.add(right);

  const height = paddingTop + Math.max(leftBottom, rightBottom) + paddingBottom;

  return { group, height };
};

const stripProtocol = (url: string) => url.replace(/^https?:\/\//, '');

type RenderFooterOptions = {
  branding: PdfBranding;
  qrImage: HTMLImageElement | null;
  verifyLink: string | null;
  pageNumber: number;
  pageCount: number;
  designHeight: number;
  i18n: I18n;
};

const renderFooter = (options: RenderFooterOptions) => {
  const { branding, qrImage, verifyLink, pageNumber, pageCount, designHeight, i18n } = options;

  const top = designHeight - pdfLayout.bottom - footerHeight;
  const group = new Konva.Group({ x: pdfLayout.marginX, y: top });

  group.add(createHairline(0));

  const qrSize = 56;
  const qrY = 20;

  if (qrImage) {
    group.add(new Konva.Image({ image: qrImage, x: 0, y: qrY, width: qrSize, height: qrSize }));
  }

  const pageText = createText({
    text: i18n._(msg`Page ${pageNumber} of ${pageCount}`),
    fontSize: 9,
    fill: pdfColors.label,
    lineHeight: 1.55,
    wrap: 'none',
  });

  const pageWidth = pageText.width();

  pageText.setAttrs({
    x: pdfLayout.contentWidth - pageWidth,
    y: qrY + qrSize - pageText.height(),
  });
  group.add(pageText);

  const textX = qrImage ? qrSize + 20 : 0;
  const textWidth = pdfLayout.contentWidth - textX - pageWidth - 20;

  const lines: Konva.Group[] = [];

  const addParagraph = (parts: { text: string; bold?: boolean }[]) => {
    const paragraph = new Konva.Group();
    let x = 0;

    for (const part of parts) {
      const text = createText({
        x,
        y: 0,
        text: part.text,
        fontSize: 9,
        lineHeight: 1.55,
        fontStyle: part.bold ? '600' : 'normal',
        fill: part.bold ? pdfColors.ink : pdfColors.label,
        wrap: 'none',
      });

      paragraph.add(text);
      x += text.width();
    }

    lines.push(paragraph);
  };

  if (verifyLink) {
    addParagraph([
      { text: i18n._(msg`Check this document`), bold: true },
      { text: ` ${i18n._(msg`by scanning the code, or at`)} ${stripProtocol(verifyLink)}` },
    ]);
  }

  addParagraph([
    {
      text: i18n._(msg`The signed PDF carries a digital signature. Any change after signing breaks it, and PDF readers show that.`),
    },
  ]);

  const details = branding.companyDetails
    ? branding.companyDetails
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .join(' · ')
    : branding.businessName;

  if (details) {
    addParagraph([{ text: details }]);
  }

  let linesHeight = 0;

  for (const [index, paragraph] of lines.entries()) {
    paragraph.setAttrs({ x: textX, y: linesHeight });
    linesHeight += paragraph.getClientRect().height + (index === lines.length - 1 ? 0 : 4);
  }

  const textGroup = new Konva.Group({ x: 0, y: qrY + qrSize - linesHeight });

  for (const paragraph of lines) {
    textGroup.add(paragraph);
  }

  // Keep a long details line inside its column.
  textGroup.clip({ x: textX, y: -4, width: textWidth, height: linesHeight + 8 });
  group.add(textGroup);

  return group;
};

type RenderFirstHeaderOptions = {
  branding: PdfBranding;
  logoImage: HTMLImageElement | null;
  envelopeId: string;
  title: string;
  statusText: string;
  isRejected: boolean;
  facts: { label: string; value: string; mono?: boolean }[];
  i18n: I18n;
};

const renderFirstPageHeader = (options: RenderFirstHeaderOptions) => {
  const { branding, logoImage, envelopeId, title, statusText, isRejected, facts, i18n } = options;

  const group = new Konva.Group();

  const letterhead = renderLetterhead({
    branding,
    logoImage,
    envelopeId,
    envelopeLabel: i18n._(msg`Envelope`),
  });
  group.add(letterhead.group);

  let y = pdfLayout.top + Math.max(letterhead.height, 32) + 52;

  group.add(new Konva.Rect({ x: pdfLayout.marginX, y, width: 48, height: 1.5, fill: branding.primaryColor }));
  y += 1.5 + 20;

  const body = new Konva.Group({ x: pdfLayout.marginX });
  group.add(body);

  const eyebrow = createLabel(i18n._(msg`Certificate of completion`), { x: 0, y, size: 9.5 });
  body.add(eyebrow);
  y += eyebrow.height() + 10;

  const titleText = createText({
    x: 0,
    y,
    width: 640,
    text: title,
    fontSize: 31,
    fontStyle: '600',
    letterSpacing: -0.775,
    lineHeight: 1.14,
    wrap: 'word',
  });
  body.add(titleText);
  y += titleText.height() + 14;

  const tickColor = isRejected ? pdfColors.alert : pdfColors.ok;

  const icon = new Konva.Group({ x: 0, y });
  icon.add(new Konva.Circle({ x: 7.5, y: 7.5, radius: 7.5, fill: tickColor }));

  const iconStroke = { stroke: pdfColors.surface, strokeWidth: 1.5, lineCap: 'round' as const, lineJoin: 'round' as const };

  if (isRejected) {
    icon.add(new Konva.Line({ points: [5.2, 5.2, 9.8, 9.8], ...iconStroke }));
    icon.add(new Konva.Line({ points: [9.8, 5.2, 5.2, 9.8], ...iconStroke }));
  } else {
    icon.add(new Konva.Line({ points: [4.7, 7.7, 6.5, 9.5, 10.3, 5.6], ...iconStroke }));
  }

  body.add(icon);

  const statusParts = statusText.split(' · ');
  const statusLead = createText({
    x: 24,
    y: y + 1,
    text: statusParts[0],
    fontSize: 12,
    fontStyle: '600',
    fill: isRejected ? pdfColors.alert : pdfColors.ink,
    wrap: 'none',
    lineHeight: 1.2,
  });
  body.add(statusLead);

  body.add(
    createText({
      x: 24 + statusLead.width(),
      y: y + 1,
      text: statusParts.length > 1 ? ` · ${statusParts.slice(1).join(' · ')}` : '',
      fontSize: 12,
      fill: pdfColors.muted,
      wrap: 'none',
      lineHeight: 1.2,
    }),
  );

  y += 15 + 44;

  group.add(createHairline(y, { x: pdfLayout.marginX }));
  y += 1 + 20;

  const columnGap = 28;
  const usable = pdfLayout.contentWidth - columnGap * 2;
  const columnWidths = [(usable * 1.25) / 3.25, usable / 3.25, usable / 3.25];
  const columnXs = [0, columnWidths[0] + columnGap, columnWidths[0] + columnWidths[1] + columnGap * 2];

  const grid = new Konva.Group({ x: pdfLayout.marginX, y });
  group.add(grid);

  let rowY = 0;

  for (let rowStart = 0; rowStart < facts.length; rowStart += 3) {
    let rowHeight = 0;

    for (const [column, fact] of facts.slice(rowStart, rowStart + 3).entries()) {
      const label = createLabel(fact.label, { x: columnXs[column], y: rowY, width: columnWidths[column] });
      const valueConfig = {
        x: columnXs[column],
        y: rowY + label.height() + 5,
        width: columnWidths[column],
        text: fact.value,
        wrap: 'word' as const,
      };

      const value = fact.mono
        ? createMono({ ...valueConfig, fontSize: 10.5 })
        : createText({ ...valueConfig, fontSize: 11, fontStyle: '500', lineHeight: 1.45 });

      grid.add(label);
      grid.add(value);

      rowHeight = Math.max(rowHeight, label.height() + 5 + value.height());
    }

    rowY += rowHeight + 18;
  }

  y += rowY - 18 + 52;

  return { group, bottom: y };
};

const renderContinuationHeader = (options: {
  branding: PdfBranding;
  logoImage: HTMLImageElement | null;
  envelopeId: string;
  i18n: I18n;
}) => {
  const { branding, logoImage, envelopeId, i18n } = options;

  const group = new Konva.Group();

  const letterhead = renderLetterhead({
    branding,
    logoImage,
    envelopeId,
    envelopeLabel: i18n._(msg`Certificate of completion`),
    compact: true,
  });
  group.add(letterhead.group);

  const ruleY = pdfLayout.top + Math.max(letterhead.height, 32) + 18;
  group.add(createHairline(ruleY, { x: pdfLayout.marginX }));

  const label = createLabel(i18n._(msg`Signed by`) + ' · ' + i18n._(msg`continued`), {
    x: pdfLayout.marginX,
    y: ruleY + 20,
  });
  group.add(label);

  return { group, bottom: label.y() + label.height() + 6 };
};

export async function renderCertificate({
  recipients,
  envelopeId,
  title,
  qrToken,
  i18n,
  envelopeOwner,
  timeZone,
  signingOrder,
  branding = DEFAULT_PDF_BRANDING,
  pageWidth,
  pageHeight,
  format = 'pdf',
}: GenerateCertificateOptions) {
  ensureFontLibrary();

  const scale = pageWidth / PDF_DESIGN_WIDTH;
  const designHeight = pageHeight / scale;
  const zone = resolvePdfTimeZone(timeZone);
  const unknown = i18n._(msg`Unknown`);

  const logoImage = loadLogoImage(branding.logo);

  // Facts and status.
  const completedDates = recipients.flatMap((recipient) =>
    recipient.logs.completed ? [recipient.logs.completed.createdAt] : [],
  );
  const sentDates = recipients.flatMap((recipient) => {
    const log = recipient.logs.emailed ?? recipient.logs.sent;

    return log ? [log.createdAt] : [];
  });

  const completedAt = completedDates.length > 0 ? new Date(Math.max(...completedDates.map((date) => date.getTime()))) : null;
  const sentAt = sentDates.length > 0 ? new Date(Math.min(...sentDates.map((date) => date.getTime()))) : null;
  const zoneReference = completedAt ?? sentAt ?? new Date();

  const signers = recipients.filter((recipient) => recipient.role === RecipientRoleEnum.SIGNER);
  const counted = signers.length > 0 ? signers : recipients.filter((recipient) => recipient.role !== RecipientRoleEnum.CC);
  const signedCount = counted.filter((recipient) => recipient.signingStatus === SigningStatus.SIGNED).length;
  const isRejected = recipients.some((recipient) => recipient.logs.rejected);

  const statusLead = isRejected ? i18n._(msg`Rejected`) : i18n._(msg`Completed`);
  const statusText = [
    statusLead,
    i18n._(msg`signed by ${signedCount} of ${counted.length}`),
    ...(completedAt ? [formatZonedDateTimeLong(completedAt, zone)] : []),
  ].join(' · ');

  const senderLine = branding.businessName
    ? `${envelopeOwner.name || envelopeOwner.email}, ${branding.businessName}`
    : envelopeOwner.name || envelopeOwner.email;

  const facts: { label: string; value: string; mono?: boolean }[] = [
    { label: i18n._(msg`Sent by`), value: senderLine },
    { label: i18n._(msg`Sent`), value: sentAt ? formatZonedDateTime(sentAt, zone) : unknown },
    { label: i18n._(msg`Completed`), value: completedAt ? formatZonedDateTime(completedAt, zone) : unknown },
    { label: i18n._(msg`Envelope ID`), value: envelopeId, mono: true },
    {
      label: i18n._(msg`Signing order`),
      value:
        signingOrder === 'SEQUENTIAL'
          ? i18n._(msg`In order, one after another`)
          : i18n._(msg`Any order`),
    },
    { label: i18n._(msg`Time zone`), value: formatZoneStatement(zoneReference, zone) },
  ];

  const verifyLink = qrToken ? `${NEXT_PUBLIC_WEBAPP_URL()}/share/${qrToken}` : null;

  let qrImage: HTMLImageElement | null = null;

  if (verifyLink) {
    const qrPng = await svgToPng(renderSVG(verifyLink, { ecc: 'Q' }));

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    qrImage = new SkiaImage(qrPng) as unknown as HTMLImageElement;
  }

  const signerBlocks = recipients.map((recipient) =>
    renderSignerBlock({ recipient, zone, primaryColor: branding.primaryColor, i18n }),
  );

  // Work out which signers go on which page.
  const footerTop = designHeight - pdfLayout.bottom - footerHeight;
  const limit = footerTop - footerGapAbove;

  const firstHeader = renderFirstPageHeader({
    branding,
    logoImage,
    envelopeId,
    title: title || i18n._(msg`Signing Certificate`),
    statusText,
    isRejected,
    facts,
    i18n,
  });

  const sectionLabelHeight = 12 + 6;
  const firstStart = firstHeader.bottom + sectionLabelHeight;
  const continuationStart = renderContinuationHeader({ branding, logoImage, envelopeId, i18n }).bottom;

  const pageBlocks: SignerBlock[][] = [[]];
  let cursor = firstStart;

  for (const block of signerBlocks) {
    const current = pageBlocks[pageBlocks.length - 1];

    if (current.length > 0 && cursor + block.height + 1 > limit) {
      pageBlocks.push([block]);
      cursor = continuationStart + block.height;
    } else {
      current.push(block);
      cursor += block.height;
    }
  }

  const pageCount = pageBlocks.length;
  const pages: Uint8Array[] = [];

  let stage: Konva.Stage | null = new Konva.Stage({ width: pageWidth, height: pageHeight });

  for (const [pageIndex, blocks] of pageBlocks.entries()) {
    stage.destroyChildren();

    const layer = new Konva.Layer();
    const content = new Konva.Group({ scaleX: scale, scaleY: scale });

    content.add(createPageBackground(PDF_DESIGN_WIDTH, designHeight));

    let y: number;

    if (pageIndex === 0) {
      // The header group is built once, so only page one may use it.
      content.add(firstHeader.group);

      const sectionLabel = createLabel(i18n._(msg`Signed by`), { x: pdfLayout.marginX, y: firstHeader.bottom });
      content.add(sectionLabel);

      y = firstStart;
    } else {
      const continuation = renderContinuationHeader({ branding, logoImage, envelopeId, i18n });
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
      renderFooter({
        branding,
        qrImage,
        verifyLink,
        pageNumber: pageIndex + 1,
        pageCount,
        designHeight,
        i18n,
      }),
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
