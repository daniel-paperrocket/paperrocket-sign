import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';

import { Paragraph, PaperRocketEmail, SAMPLE, Strong } from '../paperrocket';
import type { TemplateRecipientRemovedByAdminProps } from '../template-components/template-recipient-removed-by-admin';

export type RecipientRemovedByAdminEmailTemplateProps = Partial<TemplateRecipientRemovedByAdminProps>;

export const RecipientRemovedByAdminEmailTemplate = ({
  audience = 'recipient',
  documentName = SAMPLE.documentName,
  recipientName = SAMPLE.recipientName,
  recipientEmail = SAMPLE.recipientEmail,
}: RecipientRemovedByAdminEmailTemplateProps) => {
  const { _ } = useLingui();

  const recipientLabel =
    recipientName && recipientName !== recipientEmail ? `${recipientName} (${recipientEmail})` : recipientEmail;

  const isRecipient = audience === 'recipient';

  return (
    <PaperRocketEmail
      preheader={
        isRecipient
          ? _(msg`You have been removed from "${documentName}" by an administrator.`)
          : _(msg`${recipientName} has been removed from "${documentName}" by an administrator.`)
      }
      eyebrow={isRecipient ? _(msg`Removed from document`) : _(msg`Recipient removed`)}
      title={documentName}
      lede={
        isRecipient ? (
          <Trans>An administrator has removed you from this document, usually because the sender asked them to.</Trans>
        ) : (
          <Trans>
            An administrator has removed <Strong>{recipientLabel}</Strong> from this document, usually because the sender
            asked them to.
          </Trans>
        )
      }
      body={
        <Paragraph>
          {isRecipient ? (
            <Trans>You don't need to do anything. If you think this was a mistake, please contact the sender.</Trans>
          ) : (
            <Trans>
              You don't need to do anything. If you think this was a mistake, please contact your administrator.
            </Trans>
          )}
        </Paragraph>
      }
      footerNote={isRecipient ? 'notice' : 'account'}
    />
  );
};

export default RecipientRemovedByAdminEmailTemplate;
