import { describe, expect, it, vi } from 'vitest';
import { MANUAL_PAUSE_TRIGGER_IDLE } from '@/features/pause/domain/manual-pause-trigger-result';
import { applyManualPauseOpenResult } from './apply-manual-pause-open-result';

const trackEvent = vi.fn();
vi.mock('@/lib/posthog', () => ({ trackEvent: (...args: unknown[]) => trackEvent(...args) }));

function makePorts() {
  return {
    setError: vi.fn(),
    clearPauseSession: vi.fn(),
    setLastPauseInstanceId: vi.fn(),
    setMessage: vi.fn(),
    setContext: vi.fn(),
    setCompanionsEmpty: vi.fn(),
    setNewPauseArrival: vi.fn(),
    setLastTriggerAt: vi.fn(),
    syncOpenPauseFromDb: vi.fn().mockResolvedValue(undefined),
  };
}

describe('applyManualPauseOpenResult', () => {
  it('returns idle and sets error on idle outcome', async () => {
    const ports = makePorts();
    const result = await applyManualPauseOpenResult(
      {
        result: { outcome: 'idle', userMessage: 'Already open' },
        ctx: 'ctx',
        silentMsg: 'BTC moved.',
        assetId: 'bitcoin',
        severityBand: 'mild',
        startedAtMs: Date.now(),
      },
      ports,
    );
    expect(result).toEqual(MANUAL_PAUSE_TRIGGER_IDLE);
    expect(ports.setError).toHaveBeenCalledWith('Already open');
    expect(ports.clearPauseSession).not.toHaveBeenCalled();
  });

  it('updates home preview on opened non-pending offer', async () => {
    trackEvent.mockClear();
    const ports = makePorts();
    const result = await applyManualPauseOpenResult(
      {
        result: {
          outcome: 'opened',
          instanceId: 'pause-1',
          context: 'ctx',
          pendingOffer: false,
          created: true,
          silentStubPersisted: false,
        },
        ctx: 'ctx',
        silentMsg: 'BTC moved.',
        assetId: 'bitcoin',
        severityBand: 'moderate',
        startedAtMs: Date.now() - 5000,
      },
      ports,
    );
    expect(result.opened).toBe(true);
    expect(result.instanceId).toBe('pause-1');
    expect(ports.clearPauseSession).toHaveBeenCalled();
    expect(ports.setMessage).toHaveBeenCalledWith(null);
    expect(ports.syncOpenPauseFromDb).toHaveBeenCalled();
    expect(trackEvent).toHaveBeenCalledWith(
      'pause_instance_created',
      expect.objectContaining({ pause_instance_id: 'pause-1', source: 'manual' }),
    );
  });

  it('skips preview mutation for pending offer', async () => {
    const ports = makePorts();
    await applyManualPauseOpenResult(
      {
        result: {
          outcome: 'opened',
          instanceId: 'pause-pending',
          context: 'ctx',
          pendingOffer: true,
          created: true,
          silentStubPersisted: false,
        },
        ctx: 'ctx',
        silentMsg: 'BTC moved.',
        assetId: 'bitcoin',
        severityBand: 'mild',
        startedAtMs: Date.now(),
      },
      ports,
    );
    expect(ports.clearPauseSession).not.toHaveBeenCalled();
    expect(ports.setMessage).not.toHaveBeenCalled();
    expect(ports.syncOpenPauseFromDb).not.toHaveBeenCalled();
  });
});
