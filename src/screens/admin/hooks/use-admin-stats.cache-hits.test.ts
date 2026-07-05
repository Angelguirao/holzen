import { describe, expect, it } from 'vitest';
import { computeCacheHitsByCompanionType } from './use-admin-stats';
import type { DailyServeRow } from '@/screens/admin/public-queries';

describe('computeCacheHitsByCompanionType', () => {
  it('aggregates serves by companion_type and computes cache hit %', () => {
    const rows: DailyServeRow[] = [
      { day: '2026-05-20', companion_type: 'signal', serve_source: 'cache', serve_count: 3 },
      { day: '2026-05-21', companion_type: 'signal', serve_source: 'live', serve_count: 1 },
      { day: '2026-05-21', companion_type: 'ground_nudge', serve_source: 'cache', serve_count: 2 },
    ];

    const result = computeCacheHitsByCompanionType(rows, '2026-05-21');

    expect(result).toHaveLength(2);
    const signal = result.find((r) => r.companion_type === 'signal');
    expect(signal?.total_serves).toBe(1);
    expect(signal?.cache_hits).toBe(0);
    expect(signal?.cache_hit_pct).toBe(0);

    const ground = result.find((r) => r.companion_type === 'ground_nudge');
    expect(ground?.total_serves).toBe(2);
    expect(ground?.cache_hits).toBe(2);
    expect(ground?.cache_hit_pct).toBe(100);
  });
});
