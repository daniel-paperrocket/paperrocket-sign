import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';

import { Paragraph, PaperRocketEmail, SAMPLE } from '../paperrocket';
import type { TemplateDocumentDeleteProps } from '../template-components/template-document-super-delete';

export type DocumentDeleteEmailTemplateProps = Partial<TemplateDocumentDeleteProps>;

export const DocumentSuperDeleteEmailTemplate = ({
  documentName = SAMPLE.documentName,
  reason = 'Unknown',
}: DocumentDeleteEmailTemplateProps) => {
  const { _ } = useLingui();

  return (
    <PaperRocketEmail
      preheader={_(msg`An admin has deleted "${documentName}".`)}
      eyebrow={_(msg`Deleted by an admin`)}
      eyebrowTone="alert"
      title={documentName}
      lede={<Trans>An admin has deleted this document. It can't be recovered.</Trans>}
      body={
        <Paragraph>
          <Trans>If you want to dispute the reason, please contact support.</Trans>
        </Paragraph>
      }
      message={{ label: _(msg`Reason given`), text: reason }}
      footerNote="account"
    />
  );
};

export default DocumentSuperDeleteEmailTemplate;
