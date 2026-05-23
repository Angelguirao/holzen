/**
 * Tests for the canonical companion type definitions.
 * Ensures frontend and backend type maps stay in sync.
 */
import { describe, it, expect } from 'vitest';

import { COMPANION_TYPES, FEEDBACK_TO_CACHE_TYPE } from './companion-types';

describe('COMPANION_TYPES', () => {
  it('has all expected companion types', () => {
    expect(COMPANION_TYPES.SIGNAL).toBe('signal');
    expect(COMPANION_TYPES.GROUNDING).toBe('ground_nudge');
    expect(COMPANION_TYPES.HISTORY).toBe('historical_insight');
    expect(COMPANION_TYPES.ZOOM_OUT).toBe('zoom_out');
    expect(COMPANION_TYPES.ZOOM_OUT_DEEP_TIME).toBe('zoom_out_deep_time');
    expect(COMPANION_TYPES.REFLECTION).toBe('reflection');
  });

  it('all values are non-empty strings', () => {
    for (const [key, value] of Object.entries(COMPANION_TYPES)) {
      expect(typeof value, `${key} should be a string`).toBe('string');
      expect(value.length, `${key} should be non-empty`).toBeGreaterThan(0);
    }
  });
});

describe('FEEDBACK_TO_CACHE_TYPE', () => {
  it('maps all expected frontend keys', () => {
    expect(FEEDBACK_TO_CACHE_TYPE['signal']).toBe('signal');
    expect(FEEDBACK_TO_CACHE_TYPE['grounding']).toBe('ground_nudge');
    expect(FEEDBACK_TO_CACHE_TYPE['learning']).toBe('ground_nudge');
    expect(FEEDBACK_TO_CACHE_TYPE['zoom_out']).toBe('zoom_out');
    expect(FEEDBACK_TO_CACHE_TYPE['history_insight']).toBe('historical_insight');
    expect(FEEDBACK_TO_CACHE_TYPE['haiku']).toBe('haiku');
  });

  it('all values match a known companion type or haiku', () => {
    const validTypes = [...Object.values(COMPANION_TYPES), 'haiku'];
    for (const [key, value] of Object.entries(FEEDBACK_TO_CACHE_TYPE)) {
      expect(validTypes, `${key} → ${value} should be a valid type`).toContain(value);
    }
  });
});
