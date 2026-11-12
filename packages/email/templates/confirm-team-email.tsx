import { formatTeamUrl } from '@documenso/lib/utils/teams';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';

import { BulletList, Paragraph, PaperRocketEmail, SAMPLE } from '../paperrocket';

export type ConfirmTeamEmailProps = {
  assetBaseUrl: string;
  baseUrl: string;
  teamName: string;
  teamUrl: string;
  token: string;
};

export const ConfirmTeamEmailTemplate = ({
  baseUrl = SAMPLE.baseUrl,
  teamName = SAMPLE.organisationName,
  teamUrl = SAMPLE.teamUrl,
  token = 'Qm2kXr9TfLp4',
}: ConfirmTeamEmailProps) => {
  const { _ } = useLingui();

  const acceptUrl = `${baseUrl}/team/verify/email/${token}`;

  return (
    <PaperRocketEmail
      preheader={_(msg`${teamName} has asked to use your email address for their team.`)}
      eyebrow={_(msg`Team email request`)}
      title={_(msg`${teamName} wants to use your email address`)}
      lede={<Trans>Accepting gives {teamName} the access below. You can remove it any time in your team settings.</Trans>}
      body={
        <>
          <Paragraph>
            <Trans>By accepting, {teamName} will be able to:</Trans>
          </Paragraph>
          <BulletList
            items={[
              <Trans key="view">View all documents sent to and from this email address</Trans>,
              <Trans key="reply">Let document recipients reply directly to this email address</Trans>,
              <Trans key="send">Send documents on behalf of the team using this email address</Trans>,
            ]}
          />
        </>
      }
      button={{ href: acceptUrl, label: _(msg`Accept request`) }}
      facts={[{ label: _(msg`Team`), value: formatTeamUrl(teamUrl, baseUrl) }]}
      plainLink={{ intro: _(msg`Button not working? Open`), href: acceptUrl }}
      after={<Trans>This link expires in 1 hour.</Trans>}
      footerNote="account"
    />
  );
};

export default ConfirmTeamEmailTemplate;
