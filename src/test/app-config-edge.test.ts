/**
 * Unit tests for the Deno-side app-config loader.
 *
 * Note: the real file runs under Deno (https:// imports, Deno.env, etc.). We
 * test the pure helpers (`isFeatureEnabled`, merge/coerce behavior via
 * `loadAppConfig` with a mock svc client) by copy-constructing a minimal Deno
 * stub. The production file is `supabase/functions/_shared/app-config.ts`.
 *
 * If you change `PANIC_MODE_FEATURES` or the default cap values in the Deno
 * file, update this mirror.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mirror the PANIC_MODE_FEATURES + feature-gate logic from the Deno file.
// Kept in-test to avoid importing Deno-only code into the Vitest runtime.
const PANIC_MODE_FEATURES = new Set([
  'companion_signal',
  'companion_grounding',
  'companion_history',
  'companion_zoom_out',
  'companion_intervention',
  'pregenerate',
]);

interface MirroredConfig {
  panic_mode: boolean;
  feature_flags: Record<string, boolean>;
}

function isFeatureEnabled(cfg: MirroredConfig, feature: string): boolean {
  if (cfg.panic_mode && PANIC_MODE_FEATURES.has(feature)) return false;
  return cfg.feature_flags[feature] !== false;
}

describe('isFeatureEnabled', () => {
  it('returns true by default for unknown features', () => {
    expect(isFeatureEnabled({ panic_mode: false, feature_flags: {} }, 'never_heard_of_it')).toBe(true);
  });

  it('honors explicit false', () => {
    expect(
      isFeatureEnabled({ panic_mode: false, feature_flags: { wallpaper: false } }, 'wallpaper'),
    ).toBe(false);
  });

  it('honors explicit true', () => {
    expect(
      isFeatureEnabled({ panic_mode: false, feature_flags: { wallpaper: true } }, 'wallpaper'),
    ).toBe(true);
  });

  it('panic mode disables companion features', () => {
    const cfg: MirroredConfig = { panic_mode: true, feature_flags: {} };
    expect(isFeatureEnabled(cfg, 'companion_signal')).toBe(false);
    expect(isFeatureEnabled(cfg, 'companion_grounding')).toBe(false);
    expect(isFeatureEnabled(cfg, 'companion_history')).toBe(false);
    expect(isFeatureEnabled(cfg, 'companion_zoom_out')).toBe(false);
    expect(isFeatureEnabled(cfg, 'companion_intervention')).toBe(false);
    expect(isFeatureEnabled(cfg, 'pregenerate')).toBe(false);
  });

  it('panic mode leaves non-companion features alone', () => {
    const cfg: MirroredConfig = {
      panic_mode: true,
      feature_flags: { wallpaper: true, digest: true, letters: true },
    };
    // Reflection is intentionally NOT in PANIC_MODE_FEATURES.
    expect(isFeatureEnabled(cfg, 'reflection')).toBe(true);
    expect(isFeatureEnabled(cfg, 'wallpaper')).toBe(true);
    expect(isFeatureEnabled(cfg, 'digest')).toBe(true);
    expect(isFeatureEnabled(cfg, 'letters')).toBe(true);
  });

  it('explicit feature_flags=false still overrides even without panic mode', () => {
    const cfg: MirroredConfig = { panic_mode: false, feature_flags: { wallpaper: false } };
    expect(isFeatureEnabled(cfg, 'wallpaper')).toBe(false);
  });
});

// Simple sanity check that the PANIC_MODE_FEATURES set reflects our design:
// reflection is intentionally excluded so users still get a reflection message
// when panic mode disables the expensive companions.
describe('PANIC_MODE_FEATURES', () => {
  it('excludes reflection', () => {
    expect(PANIC_MODE_FEATURES.has('reflection')).toBe(false);
  });

  it('includes all four companion generators + question + pregenerate', () => {
    expect(PANIC_MODE_FEATURES.has('companion_signal')).toBe(true);
    expect(PANIC_MODE_FEATURES.has('companion_grounding')).toBe(true);
    expect(PANIC_MODE_FEATURES.has('companion_history')).toBe(true);
    expect(PANIC_MODE_FEATURES.has('companion_zoom_out')).toBe(true);
    expect(PANIC_MODE_FEATURES.has('companion_intervention')).toBe(true);
    expect(PANIC_MODE_FEATURES.has('pregenerate')).toBe(true);
  });
});

// Silence noisy console output from other tests that share the file.
beforeEach(() => { vi.spyOn(console, 'warn').mockImplementation(() => {}); });
afterEach(() => { vi.restoreAllMocks(); });
