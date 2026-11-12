import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';

import { PaperRocketEmail, SAMPLE, Strong } from '../paperrocket';
import type { TemplateDocumentCancelProps } from '../template-components/template-document-cancel';

export type DocumentCancelEmailTemplateProps = Partial<TemplateDocumentCancelProps>;

export const RecipientRemovedFromDocumentTemplate = ({
  inviterName = SAMPLE.senderName,
  documentName = SAMPLE.documentName,
}: DocumentCancelEmailTemplateProps) => {
  const { _ } = useLingui();

  return (
    <PaperRocketEmail
      preheader={_(msg`${inviterName} has removed you from "${documentName}".`)}
      eyebrow={_(msg`Removed from document`)}
      title={documentName}
      lede={
        <Trans>
          <Strong>{inviterName}</Strong> has removed you from this document. You don't need to do anything.
        </Trans>
      }
      senderName={inviterName}
      footerNote="notice"
    />
  );
};

export default RecipientRemovedFromDocumentTemplate;
