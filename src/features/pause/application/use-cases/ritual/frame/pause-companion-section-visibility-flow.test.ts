import { describe, expect, it } from 'vitest';

import {
  getCompanionSectionVisibility,
  isCompanionSectionVisible,
} from './pause-companion-section-visibility-flow';

describe('pause-companion-section-visibility-flow', () => {
  it('re-exports section visibility helpers from section-visibility', () => {
    expect(typeof getCompanionSectionVisibility).toBe('function');
    expect(typeof isCompanionSectionVisible).toBe('function');
  });
});
