import type { TPasswordChangeSource } from '@documenso/lib/jobs/definitions/emails/send-password-reset-success-email';
import { env } from '@documenso/lib/utils/env';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';

import { PaperRocketEmail, SAMPLE } from '../paperrocket';
import type { TemplateResetPasswordProps } from '../template-components/template-reset-password';

export type ResetPasswordTemplateProps = Partial<TemplateResetPasswordProps> & {
  source?: TPasswordChangeSource;
};

export const ResetPasswordTemplate = ({
  userName = SAMPLE.recipientName,
  userEmail = SAMPLE.recipientEmail,
  source = 'RESET',
}: ResetPasswordTemplateProps) => {
  const { _ } = useLingui();

  const signInUrl = `${env('NEXT_PUBLIC_WEBAPP_URL') ?? 'http://localhost:3000'}/signin`;

  return (
    <PaperRocketEmail
      preheader={
        source === 'RESET' ? _(msg`Your password has been reset.`) : _(msg`Your password was changed.`)
      }
      eyebrow={_(msg`Password changed`)}
      title={source === 'RESET' ? _(msg`Your password has been reset`) : _(msg`Your password was changed`)}
      lede={
        source === 'RESET' ? (
          <Trans>Hi {userName}, you can now sign in with your new password.</Trans>
        ) : (
          <Trans>Hi {userName}, your password was just changed from your account security settings.</Trans>
        )
      }
      button={{ href: signInUrl, label: _(msg`Sign in`) }}
      facts={[{ label: _(msg`Account`), value: `${userName}, ${userEmail}` }]}
      after={
        source === 'RESET' ? (
          <Trans>Didn't ask for this? Reset your password again straight away.</Trans>
        ) : (
          <Trans>If this was you, there is nothing more to do. If it wasn't, reset your password straight away.</Trans>
        )
      }
      footerNote="account"
    />
  );
};

export default ResetPasswordTemplate;
