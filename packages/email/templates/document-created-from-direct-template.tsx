import { RECIPIENT_ROLES_DESCRIPTION } from '@documenso/lib/constants/recipient-roles';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { RecipientRole } from '@prisma/client';

import { PaperRocketEmail, SAMPLE, Strong } from '../paperrocket';

export type DocumentCompletedEmailTemplateProps = {
  recipientName?: string;
  recipientRole?: RecipientRole;
  documentLink?: string;
  documentName?: string;
  assetBaseUrl?: string;
};

export const DocumentCreatedFromDirectTemplateEmailTemplate = ({
  recipientName = SAMPLE.recipientName,
  recipientRole = RecipientRole.SIGNER,
  documentLink = SAMPLE.documentLink,
  documentName = SAMPLE.documentName,
}: DocumentCompletedEmailTemplateProps) => {
  const { _ } = useLingui();

  const action = _(RECIPIENT_ROLES_DESCRIPTION[recipientRole].actioned).toLowerCase();

  return (
    <PaperRocketEmail
      preheader={_(msg`${recipientName} ${action} "${documentName}" using one of your direct links.`)}
      eyebrow={_(msg`Direct link used`)}
      title={documentName}
      lede={
        <Trans>
          <Strong>{recipientName}</Strong> {action} this document using one of your direct links.
        </Trans>
      }
      button={{ href: documentLink, label: _(msg`View document`) }}
      plainLink={{ intro: _(msg`Button not working? Open`), href: documentLink }}
      footerNote="account"
    />
  );
};

export default DocumentCreatedFromDirectTemplateEmailTemplate;
