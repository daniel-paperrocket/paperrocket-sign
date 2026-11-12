import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';

import { PaperRocketEmail, SAMPLE } from '../paperrocket';
import type { TemplateDocumentCompletedProps } from '../template-components/template-document-completed';

export type DocumentCompletedEmailTemplateProps = Partial<TemplateDocumentCompletedProps> & {
  customBody?: string;
  reportUrl?: string;
};

export const DocumentCompletedEmailTemplate = ({
  downloadLink = SAMPLE.documentLink,
  documentName = SAMPLE.documentName,
  customBody,
  reportUrl,
}: DocumentCompletedEmailTemplateProps) => {
  const { _ } = useLingui();

  return (
    <PaperRocketEmail
      preheader={_(msg`Everyone has signed "${documentName}". Your copy is ready.`)}
      eyebrow={_(msg`Completed`)}
      title={documentName}
      lede={<Trans>Everyone has signed this document. You can download your copy below.</Trans>}
      message={customBody ? { label: _(msg`Message`), text: customBody } : undefined}
      button={{ href: downloadLink, label: _(msg`Download PDF`) }}
      plainLink={{ intro: _(msg`Button not working? Open`), href: downloadLink }}
      footerNote="notice"
      reportUrl={reportUrl}
    />
  );
};

export default DocumentCompletedEmailTemplate;
