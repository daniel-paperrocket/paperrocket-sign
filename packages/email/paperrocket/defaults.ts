// Made-up sample values, used as template prop defaults (the preview app and CI snapshots) so nothing real or
// vendor-specific ever appears in a render. Callers always pass their own values.
export const SAMPLE = {
  documentName: 'Consultancy agreement, Lakeview Terrace',
  senderName: 'Alex Morgan',
  senderEmail: 'alex@example.co.nz',
  recipientName: 'Sam Harbour',
  recipientEmail: 'sam@example.co.nz',
  signLink: 'https://sign.example.co.nz/sign/Qm2kXr9TfLp4',
  documentLink: 'https://sign.example.co.nz/documents/12345',
  baseUrl: 'https://sign.example.co.nz',
  organisationName: 'Harbour Joinery',
  teamUrl: 'harbour-joinery',
} as const;
