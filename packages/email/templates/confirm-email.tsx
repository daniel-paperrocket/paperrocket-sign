import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';

import { PaperRocketEmail, SAMPLE } from '../paperrocket';
import type { TemplateConfirmationEmailProps } from '../template-components/template-confirmation-email';

export const ConfirmEmailTemplate = ({
  confirmationLink = `${SAMPLE.baseUrl}/verify-email/Qm2kXr9TfLp4`,
}: TemplateConfirmationEmailProps) => {
  const { _ } = useLingui();

  return (
    <PaperRocketEmail
      preheader={_(msg`Confirm your email address to finish setting up your account.`)}
      eyebrow={_(msg`Confirm your email`)}
      title={_(msg`Confirm your email address`)}
      lede={<Trans>Confirm this address to finish setting up your account.</Trans>}
      button={{ href: confirmationLink, label: _(msg`Confirm email`) }}
      plainLink={{ intro: _(msg`Button not working? Open`), href: confirmationLink }}
      after={<Trans>This link expires in 1 hour.</Trans>}
      footerNote="account"
    />
  );
};

export default ConfirmEmailTemplate;
