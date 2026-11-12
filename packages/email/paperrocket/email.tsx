import type { FooterNote } from './layout';
import { Layout } from './layout';
import type { ButtonProps, FactsProps } from './parts';
import { Button, Code, Eyebrow, Facts, Lede, Message, Notice, PlainLink, QuietLink, Small, Title } from './parts';

export type PaperRocketEmailProps = {
  preheader: string;
  /** Small label above the title ("Document to sign"). */
  eyebrow: string;
  eyebrowTone?: 'alert';
  /** The document name for document emails, a short sentence for account emails. */
  title: React.ReactNode;
  /** Who sent it and how long it takes. */
  lede?: React.ReactNode;
  /** Extra paragraphs between the lede and the button. */
  body?: React.ReactNode;
  /** The sender's message, or a reason (rejection, cancellation). */
  message?: { label: string; text?: string | null };
  /** Large mono code, shown instead of a button. */
  code?: string;
  button?: ButtonProps;
  /** A secondary action as a plain text link. */
  quietLink?: { href: string; label: string };
  facts?: FactsProps['rows'];
  plainLink?: { intro: string; href: string };
  /** A small closing note under everything else. */
  after?: React.ReactNode;
  /** The new-account warning shown above the title. */
  warning?: { title: string; body?: React.ReactNode };
  senderName?: string;
  footerNote?: FooterNote;
  reportUrl?: string;
};

/**
 * The one skeleton every Paper Rocket email uses, with different words:
 * warning, label, title, lede, message, button or code, facts, plain link.
 */
export const PaperRocketEmail = ({
  preheader,
  eyebrow,
  eyebrowTone,
  title,
  lede,
  body,
  message,
  code,
  button,
  quietLink,
  facts,
  plainLink,
  after,
  warning,
  senderName,
  footerNote,
  reportUrl,
}: PaperRocketEmailProps) => {
  return (
    <Layout preheader={preheader} senderName={senderName} footerNote={footerNote} reportUrl={reportUrl}>
      {warning ? <Notice title={warning.title}>{warning.body}</Notice> : null}

      <Eyebrow tone={eyebrowTone}>{eyebrow}</Eyebrow>
      <Title>{title}</Title>
      {lede ? <Lede>{lede}</Lede> : <div style={{ height: '24px', lineHeight: '24px', fontSize: 0 }}>&nbsp;</div>}
      {body}
      {message?.text ? <Message label={message.label} text={message.text} /> : null}
      {code ? <Code code={code} /> : null}
      {button ? <Button href={button.href} label={button.label} /> : null}
      {quietLink ? <QuietLink href={quietLink.href}>{quietLink.label}</QuietLink> : null}
      {facts && facts.length > 0 ? <Facts rows={facts} /> : null}
      {plainLink ? <PlainLink intro={plainLink.intro} href={plainLink.href} /> : null}
      {after ? <Small>{after}</Small> : null}
    </Layout>
  );
};
