import { env } from '@documenso/lib/utils/env';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';

import { PaperRocketEmail, SAMPLE } from '../paperrocket';
import type { TemplateDocumentSelfSignedProps } from '../template-components/template-document-self-signed';

export type DocumentSelfSignedTemplateProps = TemplateDocumentSelfSignedProps;

export const DocumentSelfSignedEmailTemplate = ({ documentName = SAMPLE.documentName }: DocumentSelfSignedTemplateProps) => {
  const { _ } = useLingui();

  const signUpUrl = `${env('NEXT_PUBLIC_WEBAPP_URL') ?? 'http://localhost:3000'}/signup`;

  return (
    <PaperRocketEmail
      preheader={_(msg`You have signed "${documentName}".`)}
      eyebrow={_(msg`Signed`)}
      title={documentName}
      lede={<Trans>You have signed this document. Create a free account to see your signed documents any time.</Trans>}
      button={{ href: signUpUrl, label: _(msg`Create account`) }}
      footerNote="account"
    />
  );
};

export default DocumentSelfSignedEmailTemplate;
