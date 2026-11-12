import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';

import { PaperRocketEmail, SAMPLE, Strong } from '../paperrocket';

export type OrganisationJoinEmailProps = {
  assetBaseUrl: string;
  baseUrl: string;
  memberName: string;
  memberEmail: string;
  organisationName: string;
  organisationUrl: string;
};

export const OrganisationJoinEmailTemplate = ({
  memberName = SAMPLE.recipientName,
  memberEmail = SAMPLE.recipientEmail,
  organisationName = SAMPLE.organisationName,
}: OrganisationJoinEmailProps) => {
  const { _ } = useLingui();

  const member = memberName || memberEmail;

  return (
    <PaperRocketEmail
      preheader={_(msg`${member} has joined ${organisationName}.`)}
      eyebrow={_(msg`New member`)}
      title={organisationName}
      lede={
        <Trans>
          <Strong>{member}</Strong> has joined your organisation.
        </Trans>
      }
      facts={[{ label: _(msg`Member`), value: memberName ? `${memberName}, ${memberEmail}` : memberEmail }]}
      footerNote="account"
    />
  );
};

export default OrganisationJoinEmailTemplate;
