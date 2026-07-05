import { describe, expect, it } from 'vitest';
import { buildOpenPausePreviewFromPendingOffer } from '@/features/pause/domain/home/build-open-pause-preview-from-pending-offer';

describe('buildOpenPausePreviewFromPendingOffer', () => {
  it('maps pending row to pre-Reflect active preview (Mode B)', () => {
    const preview = buildOpenPausePreviewFromPendingOffer({
      id: 'pending-1',
      created_at: '2026-06-07T12:00:00.000Z',
      context_snapshot: {
        context_text: 'BTC is down 15.1% in the last 24 hours.',
        source: 'cron',
        direction: 'down',
      },
    });

    expect(preview.lastPauseInstanceId).toBe('pending-1');
    expect(preview.openPauseState).toBe('active');
    expect(preview.hasReflectionStep).toBe(false);
    expect(preview.hasReachedReflect).toBe(false);
    expect(preview.message).toBeNull();
    expect(preview.context).toContain('BTC is down');
    expect(preview.openPauseSource).toBe('cron');
  });
});
