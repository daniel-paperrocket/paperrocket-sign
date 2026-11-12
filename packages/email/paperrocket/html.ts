export const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const MAX_PREHEADER_LENGTH = 89;

/**
 * Preheaders stay under 90 characters (DESIGN.md "Words"), cut at a word with an ellipsis.
 */
export const toPreheader = (value: string): string => {
  const text = value.replace(/\s+/g, ' ').trim();

  if (text.length <= MAX_PREHEADER_LENGTH) {
    return text;
  }

  const cut = text.slice(0, MAX_PREHEADER_LENGTH - 1);
  const lastSpace = cut.lastIndexOf(' ');
  const base = lastSpace > 40 ? cut.slice(0, lastSpace) : cut;

  return `${base.replace(/[\s.,;:]+$/, '')}…`;
};

export const getFirstName = (name: string | null | undefined): string => {
  return (name ?? '').trim().split(/\s+/)[0] ?? '';
};
