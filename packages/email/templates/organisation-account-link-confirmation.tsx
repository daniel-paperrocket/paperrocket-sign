import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';

import { PaperRocketEmail, SAMPLE, Strong } from '../paperrocket';

type OrganisationAccountLinkConfirmationTemplateProps = {
  type: 'create' | 'link';
  confirmationLink: string;
  organisationName: string;
  assetBaseUrl: string;
};

export const OrganisationAccountLinkConfirmationTemplate = ({
  type = 'link',
  confirmationLink = `${SAMPLE.baseUrl}/organisation/sso/confirm/Qm2kXr9TfLp4`,
  organisationName = SAMPLE.organisationName,
}: OrganisationAccountLinkConfirmationTemplateProps) => {
  const { _ } = useLingui();

  const isCreate = type === 'create';

  return (
    <PaperRocketEmail
      preheader={
        isCreate
          ? _(msg`${organisationName} has asked to create an account for you.`)
          : _(msg`${organisationName} has asked to link your account.`)
      }
      eyebrow={isCreate ? _(msg`Account request`) : _(msg`Account link request`)}
      title={
        isCreate
          ? _(msg`${organisationName} wants to create an account for you`)
          : _(msg`${organisationName} wants to link your account`)
      }
      lede={
        isCreate ? (
          <Trans>
            <Strong>{organisationName}</Strong> has asked to create an account on your behalf. Review the request before
            you accept.
          </Trans>
        ) : (
          <Trans>
            <Strong>{organisationName}</Strong> has asked to link your current account to their organisation. Review the
            request before you accept.
          </Trans>
        )
      }
      button={{ href: confirmationLink, label: _(msg`Review request`) }}
      plainLink={{ intro: _(msg`Button not working? Open`), href: confirmationLink }}
      after={<Trans>This link expires in 30 minutes.</Trans>}
      footerNote="account"
    />
  );
};

export default OrganisationAccountLinkConfirmationTemplate;
