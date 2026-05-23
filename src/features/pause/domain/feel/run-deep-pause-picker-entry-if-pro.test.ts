import { describe, expect, it, vi } from 'vitest';
import { runDeepPausePickerEntryIfPro } from './run-deep-pause-picker-entry-if-pro';

describe('run-deep-pause-picker-entry-if-pro', () => {
  it('gates deep picker entry on pro access', () => {
    const onDeep = vi.fn();
    const requirePro = vi.fn().mockReturnValue(false);
    expect(runDeepPausePickerEntryIfPro(requirePro, onDeep)).toBe(false);
    expect(onDeep).not.toHaveBeenCalled();

    requirePro.mockReturnValue(true);
    expect(runDeepPausePickerEntryIfPro(requirePro, onDeep)).toBe(true);
    expect(onDeep).toHaveBeenCalledTimes(1);
    expect(requirePro).toHaveBeenCalledWith('deep_pause');
  });
});
