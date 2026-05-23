import { describe, expect, it } from 'vitest';
import {
  BRIEF_DEPTH_PICKER_RITUAL_ENTRY,
  DEEP_DEPTH_PICKER_RITUAL_ENTRY,
} from './depth-picker-ritual-entries';

describe('depth-picker-ritual-entries', () => {
  it('exposes depth picker ritual entry constants', () => {
    expect(BRIEF_DEPTH_PICKER_RITUAL_ENTRY).toEqual({ ritualEntry: 'brief', briefStep: 'feel' });
    expect(DEEP_DEPTH_PICKER_RITUAL_ENTRY).toEqual({ ritualEntry: 'deep' });
  });
});
