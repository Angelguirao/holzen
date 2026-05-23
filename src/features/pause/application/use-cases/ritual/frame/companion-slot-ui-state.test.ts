import { describe, expect, it, vi } from 'vitest';
import {
  setCompanionSlotError,
  setCompanionSlotLoading,
} from './companion-slot-ui-state';

describe('companion slot UI state helpers', () => {
  it('routes loading to the matching setter', () => {
    const setSignalLoading = vi.fn();
    const setNudgeLoading = vi.fn();
    setCompanionSlotLoading('grounding', { setSignalLoading, setNudgeLoading, setHistoryLoading: vi.fn(), setZoomOutLoading: vi.fn() }, true);
    expect(setNudgeLoading).toHaveBeenCalledWith(true);
    expect(setSignalLoading).not.toHaveBeenCalled();
  });

  it('routes error to the matching setter', () => {
    const setZoomOutError = vi.fn();
    setCompanionSlotError('zoomOut', {
      setSignalError: vi.fn(),
      setNudgeError: vi.fn(),
      setHistoryError: vi.fn(),
      setZoomOutError,
    }, true);
    expect(setZoomOutError).toHaveBeenCalledWith(true);
  });
});
