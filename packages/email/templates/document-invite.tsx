import { RECIPIENT_ROLES_DESCRIPTION } from '@documenso/lib/constants/recipient-roles';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { OrganisationType, RecipientRole } from '@prisma/client';

import { getFirstName, PaperRocketEmail, SAMPLE, Strong } from '../paperrocket';
import type { TemplateDocumentInviteProps } from '../template-components/template-document-invite';

export type DocumentInviteEmailTemplateProps = Partial<TemplateDocumentInviteProps> & {
  customBody?: string;
  role: RecipientRole;
  selfSigner?: boolean;
  teamName?: string;
  teamEmail?: string;
  includeSenderDetails?: boolean;
  organisationType?: OrganisationType;
  reportUrl?: string;

  /**
   * The user's own email, not a team email, so the recipient can verify who
   * actually contacted them.
   */
  newAccountWarningSenderEmail?: string;
};

export const DocumentInviteEmailTemplate = ({
  inviterName = SAMPLE.senderName,
  inviterEmail = SAMPLE.senderEmail,
  documentName = SAMPLE.documentName,
  signDocumentLink = SAMPLE.signLink,
  customBody,
  role,
  selfSigner = false,
  teamName = '',
  includeSenderDetails,
  organisationType,
  reportUrl,
  newAccountWarningSenderEmail,
}: DocumentInviteEmailTemplateProps) => {
  const { _ } = useLingui();

  const action = _(RECIPIENT_ROLES_DESCRIPTION[role].actionVerb).toLowerCase();

  const isOrganisation = organisationType === OrganisationType.ORGANISATION && Boolean(teamName);
  const showSenderName = !isOrganisation || Boolean(includeSenderDetails);
  const messageSender = showSenderName ? getFirstName(inviterName) : teamName;

  let preheader = _(msg`${inviterName} has sent you "${documentName}" to ${action}.`);

  if (isOrganisation && !includeSenderDetails) {
    preheader = _(msg`${teamName} has sent you "${documentName}" to ${action}.`);
  }

  if (selfSigner) {
    preheader = _(msg`Please ${action} your document "${documentName}".`);
  }

  let eyebrow = _(msg`Document to sign`);
  let buttonLabel = _(msg`Review and sign`);

  if (role === RecipientRole.VIEWER || role === RecipientRole.CC) {
    eyebrow = _(msg`Document to view`);
    buttonLabel = _(msg`View document`);
  }

  if (role === RecipientRole.APPROVER) {
    eyebrow = _(msg`Document to approve`);
    buttonLabel = _(msg`Review and approve`);
  }

  if (role === RecipientRole.ASSISTANT) {
    eyebrow = _(msg`Document to assist with`);
    buttonLabel = _(msg`Review and assist`);
  }

  const takesTwoMinutes = role === RecipientRole.SIGNER || role === RecipientRole.APPROVER;

  let lede = (
    <Trans>
      <Strong>{inviterName}</Strong> has sent this for you to {action}.
    </Trans>
  );

  if (selfSigner) {
    lede = <Trans>Please {action} your document.</Trans>;
  } else if (isOrganisation && includeSenderDetails) {
    lede = (
      <Trans>
        <Strong>{inviterName}</Strong> at <Strong>{teamName}</Strong> has sent this for you to {action}.
      </Trans>
    );
  } else if (isOrganisation) {
    lede = (
      <Trans>
        <Strong>{teamName}</Strong> has sent this for you to {action}.
      </Trans>
    );
  }

  const facts: Array<{ label: string; value: React.ReactNode }> = [];

  if (!selfSigner) {
    facts.push({
      label: _(msg`From`),
      value: showSenderName ? `${inviterName}, ${inviterEmail}` : teamName,
    });
  }

  facts.push({ label: _(msg`Your part`), value: _(RECIPIENT_ROLES_DESCRIPTION[role].roleName) });

  return (
    <PaperRocketEmail
      preheader={preheader}
      eyebrow={eyebrow}
      title={documentName}
      lede={
        <>
          {lede}
          {takesTwoMinutes ? (
            <>
              {' '}
              <Trans>It takes about 2 minutes.</Trans>
            </>
          ) : null}
        </>
      }
      message={
        customBody && !selfSigner
          ? { label: _(msg`Message from ${messageSender}`), text: customBody }
          : undefined
      }
      button={{ href: signDocumentLink, label: buttonLabel }}
      facts={facts}
      plainLink={{ intro: _(msg`Button not working? Open`), href: signDocumentLink }}
      warning={
        newAccountWarningSenderEmail
          ? {
              title: _(msg`This was sent from a new account (${newAccountWarningSenderEmail})`),
              body: <Trans>Only sign if you know the sender and were expecting this.</Trans>,
            }
          : undefined
      }
      senderName={showSenderName ? inviterName : undefined}
      reportUrl={reportUrl}
    />
  );
};

export default DocumentInviteEmailTemplate;
