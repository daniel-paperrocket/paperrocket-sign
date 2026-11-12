import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';

import { PaperRocketEmail, SAMPLE } from '../paperrocket';

export type OrganisationDeleteEmailProps = {
  assetBaseUrl: string;
  organisationName: string;
  /**
   * Whether the deletion was performed by an administrator (as opposed to the owner).
   * Slightly changes the wording in the email.
   */
  deletedByAdmin?: boolean;
};

export const OrganisationDeleteEmailTemplate = ({
  organisationName = SAMPLE.organisationName,
  deletedByAdmin = false,
}: OrganisationDeleteEmailProps) => {
  const { _ } = useLingui();

  const description = deletedByAdmin
    ? msg`An administrator has deleted this organisation. You and your members can no longer reach it, its teams or its data.`
    : msg`This organisation has been deleted. You and your members can no longer reach it, its teams or its data.`;

  return (
    <PaperRocketEmail
      preheader={_(msg`Your organisation has been deleted.`)}
      eyebrow={_(msg`Organisation deleted`)}
      eyebrowTone="alert"
      title={organisationName}
      lede={_(description)}
      footerNote="account"
    />
  );
};

export default OrganisationDeleteEmailTemplate;
