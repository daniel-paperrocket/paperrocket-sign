import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';

import { PaperRocketEmail, SAMPLE, Strong } from '../paperrocket';
import type { TemplateDocumentCancelProps } from '../template-components/template-document-cancel';

export type DocumentCancelEmailTemplateProps = Partial<TemplateDocumentCancelProps>;

export const DocumentCancelTemplate = ({
  inviterName = SAMPLE.senderName,
  documentName = SAMPLE.documentName,
  cancellationReason,
}: DocumentCancelEmailTemplateProps) => {
  const { _ } = useLingui();

  return (
    <PaperRocketEmail
      preheader={_(msg`${inviterName} has cancelled "${documentName}". You don't need to sign it.`)}
      eyebrow={_(msg`Cancelled`)}
      eyebrowTone="alert"
      title={documentName}
      lede={
        <Trans>
          <Strong>{inviterName}</Strong> has cancelled this document and voided any signatures, so you don't need to sign
          it.
        </Trans>
      }
      message={cancellationReason ? { label: _(msg`Reason`), text: cancellationReason } : undefined}
      senderName={inviterName}
      footerNote="notice"
    />
  );
};

export default DocumentCancelTemplate;
