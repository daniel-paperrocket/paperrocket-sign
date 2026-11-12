import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';

import { PaperRocketEmail, SAMPLE, Strong } from '../paperrocket';
import type { TemplateRecipientExpiredProps } from '../template-components/template-recipient-expired';

export type RecipientExpiredEmailTemplateProps = Partial<TemplateRecipientExpiredProps>;

export const RecipientExpiredTemplate = ({
  documentName = SAMPLE.documentName,
  recipientName = SAMPLE.recipientName,
  recipientEmail = SAMPLE.recipientEmail,
  documentLink = SAMPLE.documentLink,
}: RecipientExpiredEmailTemplateProps) => {
  const { _ } = useLingui();

  const displayName = recipientName || recipientEmail;

  return (
    <PaperRocketEmail
      preheader={_(msg`The signing window for ${displayName} on "${documentName}" has expired.`)}
      eyebrow={_(msg`Signing window expired`)}
      eyebrowTone="alert"
      title={documentName}
      lede={
        <Trans>
          The signing window for <Strong>{displayName}</Strong> has expired. You can resend the document to give them
          more time, or cancel it.
        </Trans>
      }
      button={{ href: documentLink, label: _(msg`View document`) }}
      facts={[{ label: _(msg`Recipient`), value: `${recipientName}, ${recipientEmail}` }]}
      plainLink={{ intro: _(msg`Button not working? Open`), href: documentLink }}
      footerNote="account"
    />
  );
};

export default RecipientExpiredTemplate;
