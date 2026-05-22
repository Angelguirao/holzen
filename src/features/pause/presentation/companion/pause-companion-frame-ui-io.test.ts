import { describe, expect, it } from 'vitest';
import {
  COMPANION_FULL_VIEW_BREATHING_ROOM_MS,
  getCompanionSectionVisibility,
  isCompanionSectionVisible,
} from './pause-companion-frame-ui-io';

describe('pause-companion-frame-ui-io', () => {
  it('re-exports frame UI helpers via subcluster flow anchors', () => {
    expect(COMPANION_FULL_VIEW_BREATHING_ROOM_MS).toBeGreaterThan(0);
    expect(typeof getCompanionSectionVisibility).toBe('function');
    expect(typeof isCompanionSectionVisible).toBe('function');
  });
});
