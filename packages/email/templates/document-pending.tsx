import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';

import { PaperRocketEmail, SAMPLE } from '../paperrocket';
import type { TemplateDocumentPendingProps } from '../template-components/template-document-pending';

export type DocumentPendingEmailTemplateProps = Partial<TemplateDocumentPendingProps>;

export const DocumentPendingEmailTemplate = ({ documentName = SAMPLE.documentName }: DocumentPendingEmailTemplateProps) => {
  const { _ } = useLingui();

  return (
    <PaperRocketEmail
      preheader={_(msg`You have signed "${documentName}". We are waiting for the others.`)}
      eyebrow={_(msg`Waiting for others`)}
      title={documentName}
      lede={
        <Trans>
          You have signed this document. We are still waiting for the other signers, and we will email you as soon as it
          is done.
        </Trans>
      }
      footerNote="notice"
    />
  );
};

export default DocumentPendingEmailTemplate;
