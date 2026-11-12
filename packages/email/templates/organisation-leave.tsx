import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';

import { PaperRocketEmail, SAMPLE, Strong } from '../paperrocket';

export type OrganisationLeaveEmailProps = {
  assetBaseUrl: string;
  baseUrl: string;
  memberName: string;
  memberEmail: string;
  organisationName: string;
  organisationUrl: string;
};

export const OrganisationLeaveEmailTemplate = ({
  memberName = SAMPLE.recipientName,
  memberEmail = SAMPLE.recipientEmail,
  organisationName = SAMPLE.organisationName,
}: OrganisationLeaveEmailProps) => {
  const { _ } = useLingui();

  const member = memberName || memberEmail;

  return (
    <PaperRocketEmail
      preheader={_(msg`${member} has left ${organisationName}.`)}
      eyebrow={_(msg`Member left`)}
      title={organisationName}
      lede={
        <Trans>
          <Strong>{member}</Strong> has left your organisation.
        </Trans>
      }
      facts={[{ label: _(msg`Member`), value: memberName ? `${memberName}, ${memberEmail}` : memberEmail }]}
      footerNote="account"
    />
  );
};

export default OrganisationLeaveEmailTemplate;
