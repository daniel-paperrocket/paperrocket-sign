import { DateTime } from 'luxon';

// paperrocket-sign: certificate and audit log times (upstream bug #3386)

export const PDF_FALLBACK_TIME_ZONE = 'Pacific/Auckland';

const UNSET_TIME_ZONES = new Set(['', 'UTC', 'Etc/UTC', 'Etc/GMT', 'GMT', 'Z']);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const MONTHS_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAYS_LONG = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const NZ_ZONES = new Set(['Pacific/Auckland', 'NZ', 'Antarctica/McMurdo']);

/**
 * Upstream stores `Etc/UTC` on every envelope whose owner never picked a zone, so
 * UTC is treated as "not chosen" and the fallback is used. Never prints UTC.
 */
export const resolvePdfTimeZone = (timeZone?: string | null): string => {
  const trimmed = (timeZone ?? '').trim();

  if (UNSET_TIME_ZONES.has(trimmed)) {
    return PDF_FALLBACK_TIME_ZONE;
  }

  if (!DateTime.now().setZone(trimmed).isValid) {
    return PDF_FALLBACK_TIME_ZONE;
  }

  return trimmed;
};

/**
 * Built by hand because ICU gives "GMT+13" for Auckland in most locales.
 */
export const getZoneAbbreviation = (dateTime: DateTime): string => {
  const zoneName = dateTime.zoneName ?? '';

  if (NZ_ZONES.has(zoneName)) {
    return dateTime.isInDST ? 'NZDT' : 'NZST';
  }

  if (zoneName === 'Pacific/Chatham') {
    return dateTime.isInDST ? 'CHADT' : 'CHAST';
  }

  return dateTime.setLocale('en-AU').offsetNameShort ?? `UTC${dateTime.toFormat('ZZ')}`;
};

const toZoned = (date: Date, timeZone: string) => DateTime.fromJSDate(date).setZone(timeZone);

const pad = (value: number) => String(value).padStart(2, '0');

const formatClock = (dateTime: DateTime, withSeconds: boolean) => {
  const hour = dateTime.hour % 12 === 0 ? 12 : dateTime.hour % 12;
  const period = dateTime.hour < 12 ? 'am' : 'pm';
  const seconds = withSeconds ? `:${pad(dateTime.second)}` : '';

  return `${hour}:${pad(dateTime.minute)}${seconds} ${period}`;
};

/**
 * `13 Nov 2026, 9:42:18 am NZDT`
 */
export const formatZonedDateTime = (date: Date, timeZone: string): string => {
  const dateTime = toZoned(date, timeZone);

  return `${dateTime.day} ${MONTHS[dateTime.month - 1]} ${dateTime.year}, ${formatClock(dateTime, true)} ${getZoneAbbreviation(dateTime)}`;
};

/**
 * `Friday 13 November 2026, 10:41 am NZDT`
 */
export const formatZonedDateTimeLong = (date: Date, timeZone: string): string => {
  const dateTime = toZoned(date, timeZone);

  return `${WEEKDAYS_LONG[dateTime.weekday - 1]} ${dateTime.day} ${MONTHS_LONG[dateTime.month - 1]} ${dateTime.year}, ${formatClock(dateTime, false)} ${getZoneAbbreviation(dateTime)}`;
};

/**
 * `New Zealand, NZDT (UTC+13:00)` for the moment given.
 */
export const formatZoneStatement = (date: Date, timeZone: string): string => {
  const dateTime = toZoned(date, timeZone);
  const place = NZ_ZONES.has(timeZone) ? 'New Zealand' : timeZone.replace(/_/g, ' ');

  return `${place}, ${getZoneAbbreviation(dateTime)} (UTC${dateTime.toFormat('ZZ')})`;
};
