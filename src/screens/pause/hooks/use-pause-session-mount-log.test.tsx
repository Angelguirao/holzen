import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { holzenLog } from '@/lib/holzen-console';
import { usePauseSessionMountLog } from '@/screens/pause/hooks/use-pause-session-mount-log';

describe('usePauseSessionMountLog', () => {
  let pauseSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    pauseSpy = vi.spyOn(holzenLog, 'pause');
  });

  afterEach(() => {
    pauseSpy.mockRestore();
  });

  it('emits mount payload once including ritual restore snapshot', async () => {
    renderHook(() =>
      usePauseSessionMountLog({
        pauseInstanceIdPrefix: 'abcd1234',
        hasNavMessage: true,
        restoredFromStorage: true,
        hydrationStatus: 'ready',
        ritualEntryInitial: 'brief',
        briefStepInitial: 'integrate',
        phaseInitial: 'done',
      }),
    );

    await waitFor(() => expect(pauseSpy).toHaveBeenCalledTimes(1));
    expect(pauseSpy).toHaveBeenCalledWith(
      'mount',
      expect.objectContaining({
        pauseInstanceIdPrefix: 'abcd1234',
        hasNavMessage: true,
        restoredFromStorage: true,
        hydrationStatus: 'ready',
        ritualEntryInitial: 'brief',
        briefStepInitial: 'integrate',
        phaseInitial: 'done',
      }),
    );
  });
});
