/**
 * Tests for the shared curated fallback content pools.
 * 
 * Validates that all fallback pools:
 * - Have sufficient entries (≥5 per type)
 * - Have required fields populated
 * - Pass their own quality gates
 * - Have no slop phrases
 * - Have valid URLs
 */
import { describe, it, expect } from 'vitest';

import {
  SIGNAL_FALLBACKS,
  GROUNDING_FALLBACKS,
  HISTORY_FALLBACKS,
  ZOOM_OUT_FALLBACKS,
  REFLECTION_FALLBACKS,
  pickRandom,
} from './fallbacks.ts';

import { qualityGate, containsSlop, isValidUrl } from './quality.ts';

describe('SIGNAL_FALLBACKS', () => {
  it('has at least 5 entries', () => {
    expect(SIGNAL_FALLBACKS.length).toBeGreaterThanOrEqual(5);
  });

  it('all entries have required fields', () => {
    for (const entry of SIGNAL_FALLBACKS) {
      expect(entry.title).toBeTruthy();
      expect(entry.body).toBeTruthy();
      expect(entry.source).toBeTruthy();
      expect(entry.url).toBeTruthy();
    }
  });

  it('all entries pass the signal quality gate', () => {
    for (const entry of SIGNAL_FALLBACKS) {
      const result = qualityGate('signal', entry);
      expect(result.pass, `Failed: "${entry.title}" — ${result.reason}`).toBe(true);
    }
  });

  it('no entries contain slop', () => {
    for (const entry of SIGNAL_FALLBACKS) {
      expect(containsSlop(entry.title), `Title slop: "${entry.title}"`).toBe(false);
      expect(containsSlop(entry.body), `Body slop: "${entry.title}"`).toBe(false);
    }
  });

  it('all URLs are valid', () => {
    for (const entry of SIGNAL_FALLBACKS) {
      expect(isValidUrl(entry.url), `Invalid URL for "${entry.title}": ${entry.url}`).toBe(true);
    }
  });

  it('all titles are unique', () => {
    const titles = SIGNAL_FALLBACKS.map(e => e.title);
    expect(new Set(titles).size).toBe(titles.length);
  });
});

describe('GROUNDING_FALLBACKS', () => {
  it('has at least 5 entries', () => {
    expect(GROUNDING_FALLBACKS.length).toBeGreaterThanOrEqual(5);
  });

  it('all entries have required fields', () => {
    for (const entry of GROUNDING_FALLBACKS) {
      expect(entry.title).toBeTruthy();
      expect(entry.body).toBeTruthy();
      expect(entry.citation).toBeTruthy();
      expect(entry.url).toBeTruthy();
    }
  });

  it('all entries pass the ground_nudge quality gate', () => {
    for (const entry of GROUNDING_FALLBACKS) {
      const result = qualityGate('ground_nudge', entry);
      expect(result.pass, `Failed: "${entry.title}" — ${result.reason}`).toBe(true);
    }
  });

  it('no entries contain slop', () => {
    for (const entry of GROUNDING_FALLBACKS) {
      expect(containsSlop(entry.title), `Title slop: "${entry.title}"`).toBe(false);
      expect(containsSlop(entry.body), `Body slop: "${entry.title}"`).toBe(false);
    }
  });

  it('all titles are unique', () => {
    const titles = GROUNDING_FALLBACKS.map(e => e.title);
    expect(new Set(titles).size).toBe(titles.length);
  });
});

describe('HISTORY_FALLBACKS', () => {
  it('has at least 5 entries', () => {
    expect(HISTORY_FALLBACKS.length).toBeGreaterThanOrEqual(5);
  });

  it('all entries have required fields', () => {
    for (const entry of HISTORY_FALLBACKS) {
      expect(entry.title).toBeTruthy();
      expect(entry.btcInsight).toBeTruthy();
      expect(entry.analogy).toBeTruthy();
      expect(entry.assetClass).toBeTruthy();
      expect(entry.period).toBeTruthy();
    }
  });

  it('all entries pass the historical_insight quality gate', () => {
    for (const entry of HISTORY_FALLBACKS) {
      const result = qualityGate('historical_insight', entry);
      expect(result.pass, `Failed: "${entry.title}" — ${result.reason}`).toBe(true);
    }
  });

  it('no entries contain slop in analogy', () => {
    for (const entry of HISTORY_FALLBACKS) {
      expect(containsSlop(entry.analogy as string), `Analogy slop: "${entry.title}"`).toBe(false);
    }
  });

  it('all titles are unique', () => {
    const titles = HISTORY_FALLBACKS.map(e => e.title);
    expect(new Set(titles).size).toBe(titles.length);
  });
});

describe('ZOOM_OUT_FALLBACKS', () => {
  it('has at least 5 entries', () => {
    expect(ZOOM_OUT_FALLBACKS.length).toBeGreaterThanOrEqual(5);
  });

  it('all entries have required fields', () => {
    for (const entry of ZOOM_OUT_FALLBACKS) {
      expect(entry.title).toBeTruthy();
      expect(entry.body).toBeTruthy();
    }
  });

  it('all entries pass the zoom_out_deep_time quality gate', () => {
    for (const entry of ZOOM_OUT_FALLBACKS) {
      const result = qualityGate('zoom_out_deep_time', entry);
      expect(result.pass, `Failed: "${entry.title}" — ${result.reason}`).toBe(true);
    }
  });

  it('no entries contain slop', () => {
    for (const entry of ZOOM_OUT_FALLBACKS) {
      expect(containsSlop(entry.title), `Title slop: "${entry.title}"`).toBe(false);
      expect(containsSlop(entry.body), `Body slop: "${entry.title}"`).toBe(false);
    }
  });

  it('all titles are unique', () => {
    const titles = ZOOM_OUT_FALLBACKS.map(e => e.title);
    expect(new Set(titles).size).toBe(titles.length);
  });
});

describe('REFLECTION_FALLBACKS', () => {
  it('has at least 5 entries', () => {
    expect(REFLECTION_FALLBACKS.length).toBeGreaterThanOrEqual(5);
  });

  it('all entries have a message', () => {
    for (const entry of REFLECTION_FALLBACKS) {
      expect(entry.message).toBeTruthy();
      expect(entry.message.length).toBeGreaterThan(10);
    }
  });

  it('all entries have a haiku', () => {
    for (const entry of REFLECTION_FALLBACKS) {
      expect(entry.haiku).toBeTruthy();
      // Haiku should have newlines (3 lines)
      const lines = entry.haiku.split('\n').filter(l => l.trim());
      expect(lines.length, `Haiku for "${entry.message.slice(0, 40)}..." has ${lines.length} lines`).toBe(3);
    }
  });

  it('no entries contain slop', () => {
    for (const entry of REFLECTION_FALLBACKS) {
      expect(containsSlop(entry.message), `Message slop: "${entry.message.slice(0, 40)}..."`).toBe(false);
    }
  });

  it('all messages are unique', () => {
    const messages = REFLECTION_FALLBACKS.map(e => e.message);
    expect(new Set(messages).size).toBe(messages.length);
  });
});

describe('pickRandom', () => {
  it('returns an element from the array', () => {
    const pool = ['a', 'b', 'c'];
    const result = pickRandom(pool);
    expect(pool).toContain(result);
  });

  it('returns the only element from a single-element array', () => {
    expect(pickRandom(['x'])).toBe('x');
  });
});
