import { describe, expect, it, vi } from 'vitest';
import {
  applyBriefDepthPickerRitualEntry,
  applyDeepDepthPickerRitualEntry,
} from './apply-depth-picker-ritual-entry';

describe('applyDepthPickerRitualEntry', () => {
  it('applyBriefDepthPickerRitualEntry sets brief ritual and feel step', () => {
    const setRitualEntry = vi.fn();
    const setBriefStep = vi.fn();
    applyBriefDepthPickerRitualEntry({ setRitualEntry, setBriefStep });
    expect(setRitualEntry).toHaveBeenCalledWith('brief');
    expect(setBriefStep).toHaveBeenCalledWith('feel');
  });

  it('applyDeepDepthPickerRitualEntry sets deep ritual only', () => {
    const setRitualEntry = vi.fn();
    const setBriefStep = vi.fn();
    applyDeepDepthPickerRitualEntry({ setRitualEntry });
    expect(setRitualEntry).toHaveBeenCalledWith('deep');
    expect(setBriefStep).not.toHaveBeenCalled();
  });
});
