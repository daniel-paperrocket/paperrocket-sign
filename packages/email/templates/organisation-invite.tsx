import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';

import { PaperRocketEmail, SAMPLE, Strong } from '../paperrocket';

export type OrganisationInviteEmailProps = {
  assetBaseUrl: string;
  baseUrl: string;
  senderName: string;
  organisationName: string;
  token: string;
};

export const OrganisationInviteEmailTemplate = ({
  baseUrl = SAMPLE.baseUrl,
  senderName = SAMPLE.senderName,
  organisationName = SAMPLE.organisationName,
  token = 'Qm2kXr9TfLp4',
}: OrganisationInviteEmailProps) => {
  const { _ } = useLingui();

  const acceptUrl = `${baseUrl}/organisation/invite/${token}`;

  return (
    <PaperRocketEmail
      preheader={_(msg`${senderName} has invited you to join ${organisationName}.`)}
      eyebrow={_(msg`Invitation`)}
      title={_(msg`Join ${organisationName}`)}
      lede={
        <Trans>
          <Strong>{senderName}</Strong> has invited you to join this organisation.
        </Trans>
      }
      button={{ href: acceptUrl, label: _(msg`Accept invitation`) }}
      quietLink={{ href: `${baseUrl}/organisation/decline/${token}`, label: _(msg`Decline invitation`) }}
      facts={[
        { label: _(msg`Organisation`), value: organisationName },
        { label: _(msg`Invited by`), value: senderName },
      ]}
      plainLink={{ intro: _(msg`Button not working? Open`), href: acceptUrl }}
      senderName={senderName}
      footerNote="notice"
    />
  );
};

export default OrganisationInviteEmailTemplate;
