import { env } from '@documenso/lib/utils/env';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { Fragment } from 'react';

import { Body, Head, Html, Img, Link, Preview } from '../components';
import { getFirstName, toPreheader } from './html';
import { getLogoSize, getLogoUrl, PLATE_PADDING_X, PLATE_PADDING_Y } from './logo';
import { buildStyleSheet, COLOURS, FONT_STACK } from './styles';
import { ThemeProvider, useBuildPaperRocketTheme, usePaperRocketTheme } from './theme';

export type FooterNote = 'link' | 'notice' | 'account';

export type LayoutProps = {
  /** Shown in the inbox list under the subject. Cut to under 90 characters. */
  preheader: string;
  children: React.ReactNode;
  /** Name used in the footer note ("Reply and Paul will hear about it"). */
  senderName?: string;
  /** Which footer note fits: a personal signing link, a plain notice, or an account email. */
  footerNote?: FooterNote;
  /** Existing "report the sender" link, kept as a quiet line in the footer. */
  reportUrl?: string;
};

const hiddenInOutlook = { msoHide: 'all' } as React.CSSProperties;

const Letterhead = () => {
  const theme = usePaperRocketTheme();

  const cellStyle: React.CSSProperties = { padding: '44px 40px 38px', textAlign: 'center' };

  if (!theme.logo) {
    const wordmark = (
      <span
        className="pr-wordmark"
        style={{
          display: 'inline-block',
          font: `700 24px/32px ${FONT_STACK}`,
          letterSpacing: '-0.015em',
          color: COLOURS.ink,
        }}
      >
        {theme.name}
      </span>
    );

    return (
      <td className="pr-hdr" align="center" style={cellStyle}>
        {theme.logoHref ? (
          <Link href={theme.logoHref} style={{ textDecoration: 'none' }}>
            {wordmark}
          </Link>
        ) : (
          wordmark
        )}
      </td>
    );
  }

  const logo = theme.logo;
  const size = getLogoSize(logo);
  const hasPlate = logo.kind !== 'tile';
  const lightSize = hasPlate
    ? { width: size.width + PLATE_PADDING_X * 2, height: size.height + PLATE_PADDING_Y * 2 }
    : size;
  const isWide = logo.width / logo.height >= 3;
  const wideClass = isWide ? ' pr-logo-wide' : '';

  const lightImage = (
    <Img
      className={`pr-lt${wideClass}`}
      src={getLogoUrl(logo, 'plate', size)}
      alt={theme.name}
      width={lightSize.width}
      height={lightSize.height}
      style={{
        display: 'block',
        margin: '0 auto',
        border: 0,
        width: `${lightSize.width}px`,
        height: `${lightSize.height}px`,
        maxWidth: '100%',
      }}
    />
  );

  const darkImage =
    logo.kind === 'one-colour' ? (
      <Img
        className={`pr-dk${wideClass}`}
        src={getLogoUrl(logo, 'dark', size)}
        alt={theme.name}
        width={size.width}
        height={size.height}
        style={{
          ...hiddenInOutlook,
          display: 'none',
          maxHeight: 0,
          overflow: 'hidden',
          margin: '0 auto',
          border: 0,
          width: `${size.width}px`,
          height: `${size.height}px`,
          maxWidth: '100%',
        }}
      />
    ) : null;

  const images = (
    <Fragment>
      {lightImage}
      {darkImage}
    </Fragment>
  );

  return (
    <td className="pr-hdr" align="center" style={cellStyle}>
      {theme.logoHref ? (
        <Link href={theme.logoHref} style={{ textDecoration: 'none' }}>
          {images}
        </Link>
      ) : (
        images
      )}
    </td>
  );
};

type FooterProps = Pick<LayoutProps, 'senderName' | 'footerNote' | 'reportUrl'>;

const Footer = ({ senderName, footerNote = 'link', reportUrl }: FooterProps) => {
  const theme = usePaperRocketTheme();
  const firstName = getFirstName(senderName);

  const noteStyle: React.CSSProperties = {
    margin: '0 auto',
    maxWidth: '400px',
    fontSize: '12px',
    lineHeight: '19px',
    color: COLOURS.label,
  };

  return (
    <table
      role="presentation"
      width="100%"
      cellPadding={0}
      cellSpacing={0}
      style={{ width: '100%', marginTop: '36px' }}
    >
      <tbody>
        <tr>
          <td
            className="pr-foot"
            align="center"
            style={{ padding: '0 48px', textAlign: 'center', fontFamily: FONT_STACK }}
          >
            <p
              className="pr-foot-co"
              style={{ margin: 0, fontSize: '13px', lineHeight: '20px', fontWeight: 600, color: COLOURS.footName }}
            >
              {theme.name}
            </p>

            {theme.detailLines.length > 0 ? (
              <p
                className="pr-foot"
                style={{ margin: '4px 0 0', fontSize: '12.5px', lineHeight: '20px', color: COLOURS.label }}
              >
                {theme.detailLines.map((line, index) => (
                  <Fragment key={index}>
                    {index > 0 ? <br /> : null}
                    {line}
                  </Fragment>
                ))}
              </p>
            ) : null}

            <div
              className="pr-frule"
              style={{
                width: '28px',
                height: 0,
                borderTop: `1px solid ${COLOURS.line}`,
                margin: '20px auto',
                lineHeight: 0,
                fontSize: 0,
              }}
            />

            <p className="pr-foot-note" style={noteStyle}>
              {footerNote === 'link' && firstName ? (
                <Trans>
                  This link is just for you, so please don't forward this email. Not expecting it? Reply and{' '}
                  {firstName} will hear about it.
                </Trans>
              ) : null}
              {footerNote === 'link' && !firstName ? (
                <Trans>
                  This link is just for you, so please don't forward this email. Not expecting it? Reply and the
                  sender will hear about it.
                </Trans>
              ) : null}
              {footerNote === 'notice' && firstName ? (
                <Trans>Not expecting this? Reply and {firstName} will hear about it.</Trans>
              ) : null}
              {footerNote === 'notice' && !firstName ? (
                <Trans>Not expecting this? Reply and the sender will hear about it.</Trans>
              ) : null}
              {footerNote === 'account' ? (
                <Trans>You are getting this email because of activity on your account.</Trans>
              ) : null}
            </p>

            {reportUrl ? (
              <p className="pr-foot-note" style={{ ...noteStyle, marginTop: '10px' }}>
                <Trans>
                  Did not expect this email?{' '}
                  <Link
                    href={reportUrl}
                    style={{ color: COLOURS.muted, textDecoration: 'underline', textDecorationColor: COLOURS.line }}
                  >
                    Report the sender
                  </Link>
                  .
                </Trans>
              </p>
            ) : null}

            {theme.siteHref && theme.siteLabel ? (
              <p className="pr-foot-link" style={{ margin: '14px 0 0', fontSize: '12px', lineHeight: '18px' }}>
                <Link
                  href={theme.siteHref}
                  target="_blank"
                  style={{
                    color: COLOURS.muted,
                    textDecoration: 'underline',
                    textDecorationColor: COLOURS.line,
                    textUnderlineOffset: '2px',
                  }}
                >
                  {theme.siteLabel}
                </Link>
              </p>
            ) : null}
          </td>
        </tr>
      </tbody>
    </table>
  );
};

const LayoutContent = ({ preheader, children, senderName, footerNote, reportUrl }: LayoutProps) => {
  const theme = usePaperRocketTheme();
  const { i18n } = useLingui();

  return (
    <Html lang={i18n.locale || 'en'}>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
        <style dangerouslySetInnerHTML={{ __html: buildStyleSheet(theme) }} />
      </Head>

      <Preview>{toPreheader(preheader)}</Preview>

      <Body
        className="pr-page"
        style={{ margin: 0, padding: 0, background: COLOURS.page, fontFamily: FONT_STACK, color: COLOURS.ink }}
      >
        <table
          role="presentation"
          className="pr-page"
          width="100%"
          cellPadding={0}
          cellSpacing={0}
          {...{ bgcolor: COLOURS.page }}
          style={{ width: '100%', background: COLOURS.page }}
        >
          <tbody>
            <tr>
              <td className="pr-outer" align="center" style={{ padding: '40px 20px 48px' }}>
                <table
                  role="presentation"
                  align="center"
                  width={600}
                  cellPadding={0}
                  cellSpacing={0}
                  style={{ width: '100%', maxWidth: '600px', margin: '0 auto' }}
                >
                  <tbody>
                    <tr>
                      <td>
                        <table
                          role="presentation"
                          className="pr-card"
                          width="100%"
                          cellPadding={0}
                          cellSpacing={0}
                          {...{ bgcolor: COLOURS.card }}
                          style={{
                            width: '100%',
                            background: COLOURS.card,
                            border: `1px solid ${COLOURS.cardBorder}`,
                            borderRadius: '14px',
                            borderCollapse: 'separate',
                            overflow: 'hidden',
                          }}
                        >
                          <tbody>
                            <tr>
                              <td
                                className="pr-stripe"
                                height={3}
                                {...{ bgcolor: theme.brand }}
                                style={{ height: '3px', lineHeight: '3px', fontSize: 0, background: theme.brand }}
                              >
                                &nbsp;
                              </td>
                            </tr>
                            <tr>
                              <Letterhead />
                            </tr>
                            <tr>
                              <td className="pr-rule" style={{ padding: '0 48px', lineHeight: 0, fontSize: 0 }}>
                                <div
                                  className="pr-rule-line"
                                  style={{
                                    height: 0,
                                    borderTop: `1px solid ${COLOURS.cardBorder}`,
                                    lineHeight: 0,
                                    fontSize: 0,
                                  }}
                                />
                              </td>
                            </tr>
                            <tr>
                              <td className="pr-in" style={{ padding: '36px 48px 40px', fontFamily: FONT_STACK }}>
                                {children}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <Footer senderName={senderName} footerNote={footerNote} reportUrl={reportUrl} />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </Body>
    </Html>
  );
};

/**
 * The shared Paper Rocket email shell: stripe, letterhead, card, footer outside the card.
 * Everything inside is tables with inline styles; the `<style>` holds only dark mode and phone rules.
 */
export const Layout = (props: LayoutProps) => {
  const siteUrl = env('NEXT_PUBLIC_WEBAPP_URL') ?? null;
  const theme = useBuildPaperRocketTheme(siteUrl);

  return (
    <ThemeProvider value={theme}>
      <LayoutContent {...props} />
    </ThemeProvider>
  );
};
