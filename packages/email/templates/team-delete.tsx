import { formatTeamUrl } from '@documenso/lib/utils/teams';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';

import { PaperRocketEmail, SAMPLE } from '../paperrocket';

export type TeamDeleteEmailProps = {
  assetBaseUrl: string;
  baseUrl: string;
  teamUrl: string;
};

export const TeamDeleteEmailTemplate = ({
  baseUrl = SAMPLE.baseUrl,
  teamUrl = SAMPLE.teamUrl,
}: TeamDeleteEmailProps) => {
  const { _ } = useLingui();

  return (
    <PaperRocketEmail
      preheader={_(msg`A team you were part of has been deleted.`)}
      eyebrow={_(msg`Team deleted`)}
      eyebrowTone="alert"
      title={formatTeamUrl(teamUrl, baseUrl)}
      lede={<Trans>This team has been deleted. You can no longer reach it or its documents.</Trans>}
      footerNote="account"
    />
  );
};

export default TeamDeleteEmailTemplate;
