import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';

import { PaperRocketEmail, SAMPLE, Strong } from '../paperrocket';

export interface DocumentRecipientSignedEmailTemplateProps {
  documentName?: string;
  recipientName?: string;
  recipientEmail?: string;
  assetBaseUrl?: string;
}

export const DocumentRecipientSignedEmailTemplate = ({
  documentName = SAMPLE.documentName,
  recipientName = SAMPLE.recipientName,
  recipientEmail = SAMPLE.recipientEmail,
}: DocumentRecipientSignedEmailTemplateProps) => {
  const { _ } = useLingui();

  const recipientReference = recipientName || recipientEmail;

  return (
    <PaperRocketEmail
      preheader={_(msg`${recipientReference} has signed "${documentName}".`)}
      eyebrow={_(msg`Signed`)}
      title={documentName}
      lede={
        <Trans>
          <Strong>{recipientReference}</Strong> has signed this document.
        </Trans>
      }
      facts={[{ label: _(msg`Signed by`), value: `${recipientName}, ${recipientEmail}` }]}
      footerNote="account"
    />
  );
};

export default DocumentRecipientSignedEmailTemplate;
