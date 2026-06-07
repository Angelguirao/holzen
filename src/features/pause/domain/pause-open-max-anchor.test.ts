import { describe, expect, it } from 'vitest';
import {
  isPauseOpenMaxExpired,
  parsePauseCalmSettledAt,
  resolvePauseOpenMaxAnchorAt,
} from '@/features/pause/domain/pause-open-max-anchor';

const NOW_MS = new Date('2026-06-09T20:00:00.000Z').getTime();

describe('resolvePauseOpenMaxAnchorAt', () => {
  it('cron engaged without calm_settled_at has no anchor yet', () => {
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

  it('cron engaged uses calm_settled_at when present', () => {
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

  it('manual engaged uses engaged_at', () => {
    expect(
      resolvePauseOpenMaxAnchorAt({
        state: 'engaged',
        source: 'manual',
        engaged_at: '2026-06-09T10:00:00.000Z',
        created_at: '2026-06-09T08:00:00.000Z',
      }),
    ).toBe('2026-06-09T10:00:00.000Z');
  });
});

describe('isPauseOpenMaxExpired', () => {
  it('does not expire cron engaged before calm_settled_at', () => {
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

  it('expires cron engaged 12h after calm_settled_at', () => {
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
});

describe('parsePauseCalmSettledAt', () => {
  it('rejects invalid strings', () => {
    expect(parsePauseCalmSettledAt({ calm_settled_at: 'not-a-date' })).toBeNull();
  });
});
