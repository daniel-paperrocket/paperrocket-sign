import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';

import { PaperRocketEmail, SAMPLE } from '../paperrocket';
import type { TemplateAdminUserCreatedProps } from '../template-components/template-admin-user-created';

export const AdminUserCreatedTemplate = ({
  resetPasswordLink = `${SAMPLE.baseUrl}/reset-password/Qm2kXr9TfLp4`,
}: TemplateAdminUserCreatedProps) => {
  const { _ } = useLingui();

  return (
    <PaperRocketEmail
      preheader={_(msg`An account has been set up for you. Choose your password to start.`)}
      eyebrow={_(msg`Welcome`)}
      title={_(msg`Set your password`)}
      lede={<Trans>An administrator has created an account for you. Choose a password to get started.</Trans>}
      button={{ href: resetPasswordLink, label: _(msg`Set password`) }}
      plainLink={{ intro: _(msg`Button not working? Open`), href: resetPasswordLink }}
      after={<Trans>This link expires in 24 hours. If you weren't expecting an account, you can ignore this email.</Trans>}
      footerNote="account"
    />
  );
};

export default AdminUserCreatedTemplate;
