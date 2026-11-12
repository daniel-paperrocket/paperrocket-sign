import { RECIPIENT_ROLES_DESCRIPTION } from '@documenso/lib/constants/recipient-roles';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { RecipientRole } from '@prisma/client';

import { PaperRocketEmail, SAMPLE, Strong } from '../paperrocket';

export type DocumentReminderEmailTemplateProps = {
  recipientName: string;
  documentName: string;
  signDocumentLink: string;
  assetBaseUrl?: string;
  customBody?: string;
  role: RecipientRole;
  reportUrl?: string;
  newAccountWarningSenderEmail?: string;
};

export const DocumentReminderEmailTemplate = ({
  recipientName = SAMPLE.recipientName,
  documentName = SAMPLE.documentName,
  signDocumentLink = SAMPLE.signLink,
  customBody,
  role = RecipientRole.SIGNER,
  reportUrl,
  newAccountWarningSenderEmail,
}: DocumentReminderEmailTemplateProps) => {
  const { _ } = useLingui();

  const action = _(RECIPIENT_ROLES_DESCRIPTION[role].actionVerb).toLowerCase();

  let buttonLabel = _(msg`Review and sign`);

  if (role === RecipientRole.VIEWER || role === RecipientRole.CC) {
    buttonLabel = _(msg`View document`);
  }

  if (role === RecipientRole.APPROVER) {
    buttonLabel = _(msg`Review and approve`);
  }

  if (role === RecipientRole.ASSISTANT) {
    buttonLabel = _(msg`Review and assist`);
  }

  return (
    <PaperRocketEmail
      preheader={_(msg`A reminder to ${action} "${documentName}".`)}
      eyebrow={_(msg`Reminder`)}
      title={documentName}
      lede={
        <Trans>
          Hi <Strong>{recipientName}</Strong>, this is a reminder to {action} this document.
        </Trans>
      }
      message={customBody ? { label: _(msg`Message`), text: customBody } : undefined}
      button={{ href: signDocumentLink, label: buttonLabel }}
      facts={[{ label: _(msg`Your part`), value: _(RECIPIENT_ROLES_DESCRIPTION[role].roleName) }]}
      plainLink={{ intro: _(msg`Button not working? Open`), href: signDocumentLink }}
      warning={
        newAccountWarningSenderEmail
          ? {
              title: _(msg`This was sent from a new account (${newAccountWarningSenderEmail})`),
              body: <Trans>Only sign if you know the sender and were expecting this.</Trans>,
            }
          : undefined
      }
      reportUrl={reportUrl}
    />
  );
};

export default DocumentReminderEmailTemplate;
