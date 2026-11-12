import { SUPPORT_EMAIL } from '@documenso/lib/constants/app';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { match } from 'ts-pattern';

import { Paragraph, PaperRocketEmail, SAMPLE } from '../paperrocket';

export type OrganisationLimitAlertEmailProps = {
  assetBaseUrl: string;
  organisationName: string;
  counter: 'document' | 'email' | 'api';
  kind: 'rateLimit' | 'quota' | 'quotaNearing';
  period: string;
};

export const OrganisationLimitAlertEmailTemplate = ({
  organisationName = SAMPLE.organisationName,
  counter = 'email',
  kind = 'quota',
}: OrganisationLimitAlertEmailProps) => {
  const { _ } = useLingui();

  const isNearing = kind === 'quotaNearing';

  const explanation = match(kind)
    .with('quota', () =>
      match(counter)
        .with('document', () => (
          <Trans>
            We've noticed document activity on your account that goes past the fair use limits of your plan. As a
            precaution, new document activity has been paused while we review it.
          </Trans>
        ))
        .with('email', () => (
          <Trans>
            We've noticed email activity on your account that goes past the fair use limits of your plan. As a
            precaution, new email activity has been paused while we review it.
          </Trans>
        ))
        .with('api', () => (
          <Trans>
            We've noticed API activity on your account that goes past the fair use limits of your plan. As a
            precaution, new API activity has been paused while we review it.
          </Trans>
        ))
        .exhaustive(),
    )
    .with('rateLimit', () =>
      match(counter)
        .with('document', () => (
          <Trans>Your organisation is creating documents faster than normal, so some requests are being slowed down.</Trans>
        ))
        .with('email', () => (
          <Trans>Your organisation is sending emails faster than normal, so some requests are being slowed down.</Trans>
        ))
        .with('api', () => (
          <Trans>Your organisation is making API requests faster than normal, so some requests are being slowed down.</Trans>
        ))
        .exhaustive(),
    )
    .with('quotaNearing', () =>
      match(counter)
        .with('document', () => (
          <Trans>
            Your organisation is close to the fair use limit for creating documents on your plan. Once it is reached, new
            document activity will be paused.
          </Trans>
        ))
        .with('email', () => (
          <Trans>
            Your organisation is close to the fair use limit for sending email on your plan. Once it is reached, new
            email activity will be paused.
          </Trans>
        ))
        .with('api', () => (
          <Trans>
            Your organisation is close to the fair use limit for API requests on your plan. Once it is reached, new API
            activity will be paused.
          </Trans>
        ))
        .exhaustive(),
    )
    .exhaustive();

  return (
    <PaperRocketEmail
      preheader={isNearing ? _(msg`Your organisation is close to its plan limits.`) : _(msg`Your organisation needs a review.`)}
      eyebrow={isNearing ? _(msg`Approaching plan limits`) : _(msg`Review needed`)}
      title={organisationName}
      lede={explanation}
      body={
        <Paragraph>
          {isNearing ? (
            <Trans>If you expect to need higher limits, email {SUPPORT_EMAIL} and we will review your account.</Trans>
          ) : (
            <Trans>Please email {SUPPORT_EMAIL} and we will review your account.</Trans>
          )}
        </Paragraph>
      }
      footerNote="account"
    />
  );
};

export default OrganisationLimitAlertEmailTemplate;
