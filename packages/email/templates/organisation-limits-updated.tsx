import { SUPPORT_EMAIL } from '@documenso/lib/constants/app';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';

import { Paragraph, PaperRocketEmail, SAMPLE } from '../paperrocket';

export type OrganisationLimitsUpdatedEmailProps = {
  assetBaseUrl: string;
  organisationName: string;
};

export const OrganisationLimitsUpdatedEmailTemplate = ({
  organisationName = SAMPLE.organisationName,
}: OrganisationLimitsUpdatedEmailProps) => {
  const { _ } = useLingui();

  return (
    <PaperRocketEmail
      preheader={_(ORGANISATION_LIMITS_UPDATED_SUBJECT)}
      eyebrow={_(msg`Limits updated`)}
      title={organisationName}
      lede={<Trans>We've updated the usage limits for your organisation.</Trans>}
      body={
        <>
          <Paragraph>
            <Trans>If you recently got an email about your usage limits, this change was made in response to it.</Trans>
          </Paragraph>
          <Paragraph>
            <Trans>If you have any questions, email {SUPPORT_EMAIL}.</Trans>
          </Paragraph>
        </>
      }
      footerNote="account"
    />
  );
};

export const ORGANISATION_LIMITS_UPDATED_SUBJECT = msg`Your organisation limits have been updated`;

export default OrganisationLimitsUpdatedEmailTemplate;
