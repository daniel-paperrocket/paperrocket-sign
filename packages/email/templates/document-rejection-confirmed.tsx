import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';

import { Paragraph, PaperRocketEmail, SAMPLE, Strong } from '../paperrocket';

export type DocumentRejectionConfirmedEmailProps = {
  recipientName: string;
  documentName: string;
  documentOwnerName: string;
  reason: string;
  assetBaseUrl?: string;
};

export function DocumentRejectionConfirmedEmail({
  documentName = SAMPLE.documentName,
  documentOwnerName = SAMPLE.senderName,
  reason,
}: DocumentRejectionConfirmedEmailProps) {
  const { _ } = useLingui();

  return (
    <PaperRocketEmail
      preheader={_(msg`You have rejected "${documentName}". ${documentOwnerName} has been told.`)}
      eyebrow={_(msg`Rejection confirmed`)}
      title={documentName}
      lede={
        <Trans>
          You have rejected this document, sent by <Strong>{documentOwnerName}</Strong>.
        </Trans>
      }
      body={
        <Paragraph>
          <Trans>
            {documentOwnerName} has been told. You don't need to do anything else, though they may get in touch with
            questions.
          </Trans>
        </Paragraph>
      }
      message={reason ? { label: _(msg`Your reason`), text: reason } : undefined}
      senderName={documentOwnerName}
      footerNote="notice"
    />
  );
}

export default DocumentRejectionConfirmedEmail;
