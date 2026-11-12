import type { PaperRocketTheme } from './theme';

export const FONT_STACK = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
export const MONO_STACK = 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace';

export const COLOURS = {
  page: '#F6F6F4',
  card: '#FFFFFF',
  cardBorder: '#ECECE8',
  ink: '#141414',
  ink2: '#2A2A28',
  muted: '#5C5C58',
  label: '#8A8A85',
  line: '#D9D9D4',
  footName: '#3A3A38',
  alert: '#B42318',
} as const;

/**
 * The only `<style>` rules: designed dark mode (Apple Mail, iOS Mail, Outlook Mac and apps) and the phone tidy-up.
 * Everything else is inline. Kept small for Gmail's 16 KB cap.
 */
export const buildStyleSheet = (theme: PaperRocketTheme): string => `
@media (prefers-color-scheme: dark) {
  .pr-page { background: #000000 !important; }
  .pr-card { background: #141416 !important; border-color: #1E1E21 !important; }
  .pr-stripe { background: ${theme.dark.fill} !important; }
  .pr-lt { display: none !important; max-height: 0 !important; }
  .pr-dk { display: block !important; max-height: none !important; overflow: visible !important; }
  .pr-rule-line { border-color: #26262A !important; }
  .pr-wordmark { color: #F2F2F2 !important; }
  .pr-title, .pr-fact-v, .pr-code { color: #F2F2F2 !important; }
  .pr-lede { color: #A1A1A6 !important; }
  .pr-lede b { color: #ECECEC !important; }
  .pr-text { color: #D7D7DB !important; }
  .pr-msg { color: #D7D7DB !important; border-left-color: ${theme.dark.fill} !important; }
  .pr-notice { border-left-color: #F2F2F2 !important; color: #D7D7DB !important; }
  .pr-label { color: #7C7C82 !important; }
  .pr-alert { color: #F97066 !important; }
  .pr-fact-first td { border-color: #26262A !important; }
  .pr-code { border-color: #3A3A3E !important; }
  .pr-small a { color: #A1A1A6 !important; text-decoration-color: #3A3A3E !important; }
  .pr-btn-td { background: ${theme.dark.fill} !important; }
  .pr-btn { background: ${theme.dark.fill} !important; color: ${theme.dark.text} !important; }
  .pr-btn-quiet { color: #A1A1A6 !important; text-decoration-color: #3A3A3E !important; }
  .pr-foot-co { color: #C7C7CC !important; }
  .pr-foot, .pr-foot-note { color: #6E6E73 !important; }
  .pr-frule { border-color: #2C2C30 !important; }
  .pr-foot-link a { color: #A1A1A6 !important; text-decoration-color: #3A3A3E !important; }
}
@media only screen and (max-width: 480px) {
  .pr-outer { padding: 20px 12px 32px !important; }
  .pr-hdr { padding: 32px 24px 28px !important; }
  .pr-rule { padding: 0 24px !important; }
  .pr-in { padding: 28px 24px 30px !important; }
  .pr-title { font-size: 24px !important; }
  .pr-btn-table { width: 100% !important; }
  .pr-btn { display: block !important; text-align: center !important; }
  .pr-logo-wide { width: 232px !important; height: auto !important; }
  .pr-fact-k { width: 92px !important; }
  .pr-code { font-size: 26px !important; }
  .pr-foot { padding: 0 20px !important; }
}
`;
