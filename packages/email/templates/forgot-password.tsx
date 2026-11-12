import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';

import { PaperRocketEmail, SAMPLE } from '../paperrocket';
import type { TemplateForgotPasswordProps } from '../template-components/template-forgot-password';

export type ForgotPasswordTemplateProps = Partial<TemplateForgotPasswordProps>;

export const ForgotPasswordTemplate = ({
  resetPasswordLink = `${SAMPLE.baseUrl}/reset-password/Qm2kXr9TfLp4`,
}: ForgotPasswordTemplateProps) => {
  const { _ } = useLingui();

  return (
    <PaperRocketEmail
      preheader={_(msg`Choose a new password for your account.`)}
      eyebrow={_(msg`Password reset`)}
      title={_(msg`Reset your password`)}
      lede={<Trans>Use the button below to choose a new password.</Trans>}
      button={{ href: resetPasswordLink, label: _(msg`Reset password`) }}
      plainLink={{ intro: _(msg`Button not working? Open`), href: resetPasswordLink }}
      after={<Trans>If you didn't ask for this, you can ignore this email and your password will stay the same.</Trans>}
      footerNote="account"
    />
  );
};

export default ForgotPasswordTemplate;
