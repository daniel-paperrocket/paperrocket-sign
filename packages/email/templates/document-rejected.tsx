import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';

import { PaperRocketEmail, SAMPLE, Strong } from '../paperrocket';

type DocumentRejectedEmailProps = {
  recipientName: string;
  documentName: string;
  documentUrl: string;
  rejectionReason: string;
  assetBaseUrl?: string;
};

export function DocumentRejectedEmail({
  recipientName = SAMPLE.recipientName,
  documentName = SAMPLE.documentName,
  documentUrl = SAMPLE.documentLink,
  rejectionReason,
}: DocumentRejectedEmailProps) {
  const { _ } = useLingui();

  return (
    <PaperRocketEmail
      preheader={_(msg`${recipientName} has rejected "${documentName}".`)}
      eyebrow={_(msg`Rejected`)}
      eyebrowTone="alert"
      title={documentName}
      lede={
        <Trans>
          <Strong>{recipientName}</Strong> has rejected this document.
        </Trans>
      }
      message={rejectionReason ? { label: _(msg`Reason`), text: rejectionReason } : undefined}
      button={{ href: documentUrl, label: _(msg`View document`) }}
      plainLink={{ intro: _(msg`Button not working? Open`), href: documentUrl }}
      footerNote="account"
    />
  );
}

export default DocumentRejectedEmail;
