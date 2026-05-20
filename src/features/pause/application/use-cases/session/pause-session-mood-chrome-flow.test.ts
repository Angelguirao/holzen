import { describe, expect, it, vi } from 'vitest';
import {
  BRIEF_DEPTH_PICKER_RITUAL_ENTRY,
  buildFeelTilesMoodLogOptions,
  DEEP_DEPTH_PICKER_RITUAL_ENTRY,
  isBriefRitualEntry,
  runDeepPausePickerEntryIfPro,
} from './pause-session-mood-chrome-flow';

describe('pause-session-mood-chrome-flow', () => {
  it('exposes depth picker ritual entry constants', () => {
    expect(BRIEF_DEPTH_PICKER_RITUAL_ENTRY).toEqual({ ritualEntry: 'brief', briefStep: 'feel' });
    expect(DEEP_DEPTH_PICKER_RITUAL_ENTRY).toEqual({ ritualEntry: 'deep' });
  });

  it('detects brief ritual and builds feel tile log options', () => {
    expect(isBriefRitualEntry('brief')).toBe(true);
    expect(isBriefRitualEntry('deep')).toBe(false);
    expect(buildFeelTilesMoodLogOptions(true, 'calm')).toEqual({
      briefRitual: true,
      briefFace: 'calm',
    });
    expect(buildFeelTilesMoodLogOptions(false, 'anxious')).toEqual({ briefFace: 'anxious' });
  });

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
