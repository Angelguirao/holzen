import { describe, expect, it } from 'vitest';
import {
  isPauseOpenMaxExpired,
  parsePauseCalmSettledAt,
  parsePausePendingOfferedAt,
  resolvePauseOpenMaxAnchorAt,
} from '@/features/pause/domain/pause-open-max-anchor';

const NOW_MS = new Date('2026-06-09T20:00:00.000Z').getTime();

describe('resolvePauseOpenMaxAnchorAt', () => {
  it('engaged without context-shift stamps has no anchor yet', () => {
    expect(
      resolvePauseOpenMaxAnchorAt({
        state: 'engaged',
        source: 'cron_volatility',
        engaged_at: '2026-06-09T06:00:00.000Z',
        created_at: '2026-06-09T06:00:00.000Z',
        metadata: {},
      }),
    ).toBeNull();
  });

  it('uses calm_settled_at when present', () => {
    expect(
      resolvePauseOpenMaxAnchorAt({
        state: 'engaged',
        source: 'cron_volatility',
        engaged_at: '2026-06-09T06:00:00.000Z',
        created_at: '2026-06-09T06:00:00.000Z',
        metadata: { calm_settled_at: '2026-06-09T19:00:00.000Z' },
      }),
    ).toBe('2026-06-09T19:00:00.000Z');
  });

  it('uses pending_offered_at when present', () => {
    expect(
      resolvePauseOpenMaxAnchorAt({
        state: 'engaged',
        source: 'cron_volatility',
        engaged_at: '2026-06-09T06:00:00.000Z',
        created_at: '2026-06-09T06:00:00.000Z',
        metadata: { pending_offered_at: '2026-06-09T18:30:00.000Z' },
      }),
    ).toBe('2026-06-09T18:30:00.000Z');
  });

  it('prefers the latest context-shift stamp', () => {
    expect(
      resolvePauseOpenMaxAnchorAt({
        state: 'engaged',
        source: 'manual',
        engaged_at: '2026-06-09T06:00:00.000Z',
        created_at: '2026-06-09T06:00:00.000Z',
        metadata: {
          calm_settled_at: '2026-06-09T10:00:00.000Z',
          pending_offered_at: '2026-06-09T12:00:00.000Z',
        },
      }),
    ).toBe('2026-06-09T12:00:00.000Z');
  });

  it('manual engaged ignores engaged_at without context-shift stamps', () => {
    expect(
      resolvePauseOpenMaxAnchorAt({
        state: 'engaged',
        source: 'manual',
        engaged_at: '2026-06-09T10:00:00.000Z',
        created_at: '2026-06-09T08:00:00.000Z',
      }),
    ).toBeNull();
  });
});

describe('isPauseOpenMaxExpired', () => {
  it('does not expire engaged before any context-shift stamp', () => {
    expect(
      isPauseOpenMaxExpired(
        {
          state: 'engaged',
          source: 'cron_volatility',
          engaged_at: '2026-06-08T00:00:00.000Z',
          created_at: '2026-06-08T00:00:00.000Z',
        },
        NOW_MS,
      ),
    ).toBe(false);
  });

  it('expires engaged 12h after calm_settled_at', () => {
    expect(
      isPauseOpenMaxExpired(
        {
          state: 'engaged',
          source: 'cron_volatility',
          engaged_at: '2026-06-08T00:00:00.000Z',
          created_at: '2026-06-08T00:00:00.000Z',
          metadata: { calm_settled_at: '2026-06-09T07:00:00.000Z' },
        },
        NOW_MS,
      ),
    ).toBe(true);
  });

  it('expires engaged 12h after pending_offered_at', () => {
    expect(
      isPauseOpenMaxExpired(
        {
          state: 'engaged',
          source: 'cron_volatility',
          engaged_at: '2026-06-08T00:00:00.000Z',
          created_at: '2026-06-08T00:00:00.000Z',
          metadata: { pending_offered_at: '2026-06-09T07:00:00.000Z' },
        },
        NOW_MS,
      ),
    ).toBe(true);
  });
});

describe('parsePauseCalmSettledAt', () => {
  it('rejects invalid strings', () => {
    expect(parsePauseCalmSettledAt({ calm_settled_at: 'not-a-date' })).toBeNull();
  });
});

describe('parsePausePendingOfferedAt', () => {
  it('rejects invalid strings', () => {
    expect(parsePausePendingOfferedAt({ pending_offered_at: 'not-a-date' })).toBeNull();
  });
});
