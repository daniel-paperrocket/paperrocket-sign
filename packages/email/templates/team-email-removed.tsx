import { formatTeamUrl } from '@documenso/lib/utils/teams';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';

import { PaperRocketEmail, SAMPLE, Strong } from '../paperrocket';

export type TeamEmailRemovedTemplateProps = {
  assetBaseUrl: string;
  baseUrl: string;
  teamEmail: string;
  teamName: string;
  teamUrl: string;
};

export const TeamEmailRemovedTemplate = ({
  baseUrl = SAMPLE.baseUrl,
  teamEmail = 'team@example.co.nz',
  teamName = SAMPLE.organisationName,
  teamUrl = SAMPLE.teamUrl,
}: TeamEmailRemovedTemplateProps) => {
  const { _ } = useLingui();

  return (
    <PaperRocketEmail
      preheader={_(msg`The team email for ${teamName} has been removed.`)}
      eyebrow={_(msg`Team email removed`)}
      title={teamName}
      lede={
        <Trans>
          The team email <Strong>{teamEmail}</Strong> has been removed from this team.
        </Trans>
      }
      facts={[{ label: _(msg`Team`), value: formatTeamUrl(teamUrl, baseUrl) }]}
      footerNote="account"
    />
  );
};

export default TeamEmailRemovedTemplate;
