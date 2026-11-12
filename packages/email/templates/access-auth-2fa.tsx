import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Plural, Trans } from '@lingui/react/macro';

import { PaperRocketEmail } from '../paperrocket';

export type AccessAuth2FAEmailTemplateProps = {
  documentTitle: string;
  code: string;
  userEmail: string;
  userName: string;
  expiresInMinutes: number;
  assetBaseUrl?: string;
};

export const AccessAuth2FAEmailTemplate = ({
  documentTitle,
  code,
  userName,
  expiresInMinutes,
}: AccessAuth2FAEmailTemplateProps) => {
  const { _ } = useLingui();

  return (
    <PaperRocketEmail
      preheader={_(msg`Your verification code is ${code}`)}
      eyebrow={_(msg`Verification code`)}
      title={_(msg`Your code to open the document`)}
      lede={
        <Trans>
          Hi {userName}, enter this code to open "{documentTitle}".
        </Trans>
      }
      code={code}
      facts={[
        {
          label: _(msg`Expires in`),
          value: <Plural value={expiresInMinutes} one="# minute" other="# minutes" />,
        },
      ]}
      after={<Trans>If you didn't ask for this code, you can ignore this email.</Trans>}
      footerNote="account"
    />
  );
};

export default AccessAuth2FAEmailTemplate;
