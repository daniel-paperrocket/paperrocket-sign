import { Fragment } from 'react';

import { Link } from '../components';
import { escapeHtml } from './html';
import { COLOURS, FONT_STACK, MONO_STACK } from './styles';
import { usePaperRocketTheme } from './theme';

export const Eyebrow = ({ children, tone }: { children: React.ReactNode; tone?: 'alert' }) => (
  <p
    className={tone === 'alert' ? 'pr-label pr-alert' : 'pr-label'}
    style={{
      margin: '0 0 12px',
      fontSize: '11px',
      lineHeight: '16px',
      letterSpacing: '0.07em',
      textTransform: 'uppercase',
      fontWeight: 600,
      color: tone === 'alert' ? COLOURS.alert : COLOURS.label,
    }}
  >
    {children}
  </p>
);

export const Title = ({ children }: { children: React.ReactNode }) => (
  <p
    className="pr-title"
    style={{
      margin: '0 0 12px',
      fontSize: '28px',
      lineHeight: 1.22,
      fontWeight: 600,
      letterSpacing: '-0.022em',
      color: COLOURS.ink,
      wordBreak: 'break-word',
    }}
  >
    {children}
  </p>
);

/** The "who sent it and how long it takes" line under the title. */
export const Lede = ({ children }: { children: React.ReactNode }) => (
  <p
    className="pr-lede"
    style={{ margin: '0 0 36px', fontSize: '15px', lineHeight: 1.55, color: COLOURS.muted }}
  >
    {children}
  </p>
);

export const Strong = ({ children }: { children: React.ReactNode }) => (
  <b style={{ color: COLOURS.ink, fontWeight: 500 }}>{children}</b>
);

export const Paragraph = ({ children }: { children: React.ReactNode }) => (
  <p
    className="pr-text"
    style={{ margin: '0 0 20px', fontSize: '16px', lineHeight: 1.5, color: COLOURS.ink2 }}
  >
    {children}
  </p>
);

const normaliseMessage = (text: string): string[] => {
  return text
    .trim()
    .replace(/\r\n?/g, '\n')
    .replace(/\n\s*\n+/g, '\n\n')
    .split('\n\n');
};

/**
 * The sender's own words (or a reason), set off by a brand-coloured rule on the left.
 */
export const Message = ({ label, text }: { label: string; text: string }) => {
  const theme = usePaperRocketTheme();

  if (!text.trim()) {
    return null;
  }

  return (
    <div
      className="pr-msg"
      style={{
        margin: '0 0 40px',
        padding: '0 0 0 18px',
        borderLeft: `1.5px solid ${theme.brand}`,
        color: COLOURS.ink2,
        fontSize: '16px',
        lineHeight: 1.6,
      }}
    >
      <span
        className="pr-label"
        style={{
          display: 'block',
          marginBottom: '6px',
          fontSize: '11px',
          lineHeight: '16px',
          letterSpacing: '0.07em',
          textTransform: 'uppercase',
          fontWeight: 600,
          color: COLOURS.label,
        }}
      >
        {label}
      </span>
      {normaliseMessage(text).map((paragraph, index, all) => (
        <p
          key={index}
          style={{ margin: index === all.length - 1 ? 0 : '0 0 12px', wordBreak: 'break-word', color: 'inherit' }}
        >
          {paragraph.split('\n').map((line, lineIndex) => (
            <Fragment key={lineIndex}>
              {lineIndex > 0 ? <br /> : null}
              {line}
            </Fragment>
          ))}
        </p>
      ))}
    </div>
  );
};

/**
 * A short warning that stays plain: an ink rule on the left, no tinted background.
 */
export const Notice = ({ title, children }: { title: string; children?: React.ReactNode }) => (
  <div
    className="pr-notice"
    style={{
      margin: '0 0 32px',
      padding: '0 0 0 18px',
      borderLeft: `3px solid ${COLOURS.ink}`,
      color: COLOURS.ink2,
      fontSize: '14px',
      lineHeight: 1.5,
    }}
  >
    <b style={{ fontWeight: 600 }}>{title}</b>
    {children ? <div style={{ marginTop: '2px' }}>{children}</div> : null}
  </div>
);

/** The font stack with single quotes, safe inside a double-quoted style attribute in raw HTML. */
const FONT_STACK_ATTR = FONT_STACK.replace(/"/g, "'");

const estimateButtonWidth = (label: string) => Math.min(520, Math.max(180, Math.round(label.length * 9 + 84)));

export type ButtonProps = {
  href: string;
  /** Already translated. Say the action: "Review and sign", "Download PDF". */
  label: string;
};

/**
 * Padding button with an MSO-conditional VML roundrect for Outlook Windows (it ignores border-radius).
 * Fill and text colours come from the brand colour by contrast. One per email.
 */
export const Button = ({ href, label }: ButtonProps) => {
  const theme = usePaperRocketTheme();
  const { fill, text } = theme.button;
  const safeHref = escapeHtml(href);
  const safeLabel = escapeHtml(label);
  const width = estimateButtonWidth(label);

  const vml =
    `<!--[if mso]>` +
    `<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${safeHref}" style="height:52px;v-text-anchor:middle;width:${width}px;" arcsize="19%" stroke="f" fillcolor="${fill}">` +
    `<w:anchorlock/>` +
    `<center style="color:${text};font-family:Arial,sans-serif;font-size:15px;font-weight:600;">${safeLabel}&nbsp;&rarr;</center>` +
    `</v:roundrect>` +
    `<![endif]-->`;

  const padding =
    `<!--[if !mso]><!-->` +
    `<table role="presentation" class="pr-btn-table" cellpadding="0" cellspacing="0" border="0"><tr>` +
    `<td class="pr-btn-td" bgcolor="${fill}" style="background:${fill};border-radius:10px;">` +
    `<a class="pr-btn" href="${safeHref}" target="_blank" style="display:inline-block;background:${fill};color:${text};text-decoration:none;font-family:${FONT_STACK_ATTR};font-weight:600;font-size:15px;line-height:20px;letter-spacing:0.005em;padding:16px 30px;border-radius:10px;">` +
    `${safeLabel}<span style="display:inline-block;margin-left:10px;">&rarr;</span></a>` +
    `</td></tr></table>` +
    `<!--<![endif]-->`;

  return (
    <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} style={{ width: '100%' }}>
      <tbody>
        <tr>
          <td style={{ padding: 0 }} dangerouslySetInnerHTML={{ __html: vml + padding }} />
        </tr>
      </tbody>
    </table>
  );
};

export type FactsProps = {
  rows: Array<{ label: string; value: React.ReactNode }>;
};

/**
 * Label and value rows under one hairline.
 */
export const Facts = ({ rows }: FactsProps) => {
  if (rows.length === 0) {
    return null;
  }

  return (
    <table
      role="presentation"
      width="100%"
      cellPadding={0}
      cellSpacing={0}
      style={{ width: '100%', borderCollapse: 'collapse', margin: '36px 0 0', fontSize: '14px', lineHeight: 1.5 }}
    >
      <tbody>
        {rows.map((row, index) => (
          <tr key={row.label} className={index === 0 ? 'pr-fact-first' : undefined}>
            <td
              className="pr-fact-k pr-label"
              style={{
                width: '112px',
                padding: index === 0 ? '20px 12px 7px 0' : '7px 12px 7px 0',
                verticalAlign: 'top',
                color: COLOURS.label,
                borderTop: index === 0 ? `1px solid ${COLOURS.cardBorder}` : undefined,
              }}
            >
              {row.label}
            </td>
            <td
              className="pr-fact-v"
              style={{
                padding: index === 0 ? '20px 0 7px' : '7px 0',
                verticalAlign: 'top',
                color: COLOURS.ink,
                wordBreak: 'break-word',
                borderTop: index === 0 ? `1px solid ${COLOURS.cardBorder}` : undefined,
              }}
            >
              {row.value}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

/**
 * The fallback link line under the button. The link text is the address itself.
 */
export const PlainLink = ({ intro, href }: { intro: string; href: string }) => {
  const bare = href.replace(/^https?:\/\//, '');
  const shown = bare.length > 45 ? `${bare.slice(0, 42)}...` : bare;

  return (
    <p
      className="pr-small pr-label"
      style={{ margin: '28px 0 0', fontSize: '13px', lineHeight: 1.55, color: COLOURS.label, wordBreak: 'break-all' }}
    >
      {intro}{' '}
      <Link
        href={href}
        style={{
          color: COLOURS.muted,
          textDecoration: 'underline',
          textDecorationColor: '#C9C9C4',
          textUnderlineOffset: '2px',
        }}
      >
        {shown}
      </Link>
    </p>
  );
};

/**
 * A quiet secondary action as a text link (never a second button).
 */
export const QuietLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <p
    className="pr-small pr-label"
    style={{ margin: '20px 0 0', fontSize: '13px', lineHeight: 1.55, color: COLOURS.label }}
  >
    <Link
      href={href}
      style={{
        color: COLOURS.muted,
        textDecoration: 'underline',
        textDecorationColor: '#C9C9C4',
        textUnderlineOffset: '2px',
      }}
    >
      {children}
    </Link>
  </p>
);

/**
 * Large mono code for 2FA and confirmation-code emails, instead of a button.
 */
export const Code = ({ code }: { code: string }) => (
  <div
    className="pr-code"
    style={{
      margin: '0 0 24px',
      padding: '22px 20px',
      border: `1px solid ${COLOURS.line}`,
      borderRadius: '10px',
      textAlign: 'center',
      fontFamily: MONO_STACK,
      fontSize: '32px',
      lineHeight: '40px',
      fontWeight: 600,
      letterSpacing: '0.18em',
      color: COLOURS.ink,
      wordBreak: 'break-all',
    }}
  >
    {code}
  </div>
);

/**
 * A small closing note under everything else (13px, quiet).
 */
export const Small = ({ children }: { children: React.ReactNode }) => (
  <p
    className="pr-small pr-label"
    style={{ margin: '24px 0 0', fontSize: '13px', lineHeight: 1.55, color: COLOURS.label }}
  >
    {children}
  </p>
);

/**
 * A short bulleted list for body copy.
 */
export const BulletList = ({ items }: { items: React.ReactNode[] }) => (
  <ul
    className="pr-text"
    style={{ margin: '0 0 20px', paddingLeft: '20px', fontSize: '16px', lineHeight: 1.5, color: COLOURS.ink2 }}
  >
    {items.map((item, index) => (
      <li key={index} style={{ marginTop: index === 0 ? 0 : '6px' }}>
        {item}
      </li>
    ))}
  </ul>
);
