import { describe, expect, it } from 'vitest';

import {
  formatZoneStatement,
  formatZonedDateTime,
  formatZonedDateTimeLong,
  resolvePdfTimeZone,
} from './format-zoned-time';

describe('formatZonedDateTime', () => {
  it('prints NZDT in summer and the zone abbreviation, never UTC', () => {
    const date = new Date('2026-11-12T20:42:18Z');

    expect(formatZonedDateTime(date, 'Pacific/Auckland')).toBe('13 Nov 2026, 9:42:18 am NZDT');
  });

  it('switches to NZST on 5 April 2026 (clocks go back at 3:00 am NZDT)', () => {
    expect(formatZonedDateTime(new Date('2026-04-04T13:59:59Z'), 'Pacific/Auckland')).toBe(
      '5 Apr 2026, 2:59:59 am NZDT',
    );
    expect(formatZonedDateTime(new Date('2026-04-04T14:00:00Z'), 'Pacific/Auckland')).toBe(
      '5 Apr 2026, 2:00:00 am NZST',
    );
  });

  it('switches to NZDT on 27 September 2026 (clocks go forward at 2:00 am NZST)', () => {
    expect(formatZonedDateTime(new Date('2026-09-26T13:59:59Z'), 'Pacific/Auckland')).toBe(
      '27 Sep 2026, 1:59:59 am NZST',
    );
    expect(formatZonedDateTime(new Date('2026-09-26T14:00:00Z'), 'Pacific/Auckland')).toBe(
      '27 Sep 2026, 3:00:00 am NZDT',
    );
  });

  it('shows midday and midnight as 12 pm and 12 am', () => {
    expect(formatZonedDateTime(new Date('2026-06-11T12:00:00Z'), 'Pacific/Auckland')).toBe(
      '12 Jun 2026, 12:00:00 am NZST',
    );
    expect(formatZonedDateTime(new Date('2026-06-12T00:00:00Z'), 'Pacific/Auckland')).toBe(
      '12 Jun 2026, 12:00:00 pm NZST',
    );
  });
});

describe('formatZonedDateTimeLong and formatZoneStatement', () => {
  it('prints the long status time and the facts-grid zone line', () => {
    const date = new Date('2026-11-12T21:41:37Z');

    expect(formatZonedDateTimeLong(date, 'Pacific/Auckland')).toBe('Friday 13 November 2026, 10:41 am NZDT');
    expect(formatZoneStatement(date, 'Pacific/Auckland')).toBe('New Zealand, NZDT (UTC+13:00)');
    expect(formatZoneStatement(new Date('2026-06-12T00:00:00Z'), 'Pacific/Auckland')).toBe(
      'New Zealand, NZST (UTC+12:00)',
    );
  });
});

describe('resolvePdfTimeZone', () => {
  it('falls back to Pacific/Auckland for missing, invalid or UTC zones and keeps real ones', () => {
    expect(resolvePdfTimeZone(null)).toBe('Pacific/Auckland');
    expect(resolvePdfTimeZone('Etc/UTC')).toBe('Pacific/Auckland');
    expect(resolvePdfTimeZone('Not/AZone')).toBe('Pacific/Auckland');
    expect(resolvePdfTimeZone('Australia/Sydney')).toBe('Australia/Sydney');
  });
});
