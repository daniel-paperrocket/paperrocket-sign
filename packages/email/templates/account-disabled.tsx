import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';

import { Link } from '../components';
import { Paragraph, PaperRocketEmail } from '../paperrocket';
import type { TemplateAccountDisabledProps } from '../template-components/template-account-disabled';

export type AccountDisabledEmailTemplateProps = Partial<TemplateAccountDisabledProps>;

export const AccountDisabledEmailTemplate = ({ supportEmail = 'support@example.co.nz' }: AccountDisabledEmailTemplateProps) => {
  const { _ } = useLingui();

  return (
    <PaperRocketEmail
      preheader={_(msg`Your account has been disabled.`)}
      eyebrow={_(msg`Account disabled`)}
      eyebrowTone="alert"
      title={_(msg`Your account has been disabled`)}
      lede={
        <Trans>
          One of your signing requests was reported, so we have disabled your account for now. You can't sign in or send
          documents while it is disabled.
        </Trans>
      }
      body={
        <Paragraph>
          <Trans>
            If you think this was a mistake, email{' '}
            <Link href={`mailto:${supportEmail}`} style={{ color: 'inherit', textDecoration: 'underline' }}>
              {supportEmail}
            </Link>
            .
          </Trans>
        </Paragraph>
      }
      footerNote="account"
    />
  );
};

export default AccountDisabledEmailTemplate;
