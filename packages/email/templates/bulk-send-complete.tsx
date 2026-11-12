import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';

import { PaperRocketEmail } from '../paperrocket';

export interface BulkSendCompleteEmailProps {
  userName: string;
  templateName: string;
  totalProcessed: number;
  successCount: number;
  failedCount: number;
  errors: string[];
  assetBaseUrl?: string;
}

export const BulkSendCompleteEmail = ({
  userName,
  templateName,
  totalProcessed,
  successCount,
  failedCount,
  errors,
}: BulkSendCompleteEmailProps) => {
  const { _ } = useLingui();

  return (
    <PaperRocketEmail
      preheader={_(msg`Bulk send finished for "${templateName}".`)}
      eyebrow={_(msg`Bulk send complete`)}
      title={templateName}
      lede={
        <Trans>
          Hi {userName}, your bulk send has finished. You can find the new documents in your dashboard under "Documents
          created from template".
        </Trans>
      }
      body={
        errors && errors.length > 0 ? (
          <div style={{ margin: '0 0 28px', fontSize: '14px', lineHeight: 1.5, color: '#2A2A28' }} className="pr-text">
            <p style={{ margin: '0 0 8px', fontWeight: 600 }}>
              <Trans>These rows had problems:</Trans>
            </p>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              {errors.map((error, index) => (
                <li key={index} style={{ marginTop: index === 0 ? 0 : '4px' }}>
                  {error}
                </li>
              ))}
            </ul>
          </div>
        ) : undefined
      }
      facts={[
        { label: _(msg`Rows processed`), value: String(totalProcessed) },
        { label: _(msg`Created`), value: String(successCount) },
        { label: _(msg`Failed`), value: String(failedCount) },
      ]}
      footerNote="account"
    />
  );
};

export default BulkSendCompleteEmail;
