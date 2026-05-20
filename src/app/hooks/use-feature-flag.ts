// Feature flag hook backed by PostHog.
//
// Shape matches the contract in docs/ops/feature-flags.md:
//
//   const { value, ready } = useFeatureFlag('ui.home_v2', false);
//   if (!ready) return <HomeClassic />;   // safe path while flags load
//   return value ? <HomeV2 /> : <HomeClassic />;
//
// Design:
//   - `value` is `boolean | string` so boolean and multivariate flags share one hook.
//   - `ready` is `true` once PostHog has flushed its initial `/decide` batch (or immediately
//     if PostHog is absent, so pre-hydration paths don't stall forever). Callers render the
//     default path until `ready === true`.
//   - Hook never throws. On any error we fall back to `defaultValue` + `ready: true`.

import { useEffect, useState } from 'react';
import { getPostHog } from '@/lib/posthog';

export type FeatureFlagValue = boolean | string;

export interface FeatureFlagResult<T extends FeatureFlagValue> {
  value: T;
  /** `true` once PostHog has delivered a decision (or we know it never will). */
  ready: boolean;
}

/**
 * Read a PostHog feature flag.
 *
 * @param flagKey `<domain>.<slug>` — see docs/ops/feature-flags.md
 * @param defaultValue value returned while flags load, if PostHog is absent, or on error
 */
export function useFeatureFlag<T extends FeatureFlagValue>(
  flagKey: string,
  defaultValue: T,
): FeatureFlagResult<T> {
  const [state, setState] = useState<FeatureFlagResult<T>>(() => ({
    value: defaultValue,
    ready: !getPostHog(),
  }));

  useEffect(() => {
    const ph = getPostHog();
    if (!ph) {
      setState({ value: defaultValue, ready: true });
      return;
    }

    setState(readFlag(ph, flagKey, defaultValue, true));

    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = ph.onFeatureFlags(() => {
        setState(readFlag(ph, flagKey, defaultValue, true));
      });
    } catch {
      /* older SDKs — initial read is still fine */
    }
    return () => {
      try {
        unsubscribe?.();
      } catch {
        /* no-op */
      }
    };
  }, [flagKey, defaultValue]);

  return state;
}

function readFlag<T extends FeatureFlagValue>(
  ph: NonNullable<ReturnType<typeof getPostHog>>,
  flagKey: string,
  defaultValue: T,
  ready: boolean,
): FeatureFlagResult<T> {
  try {
    if (typeof defaultValue === 'boolean') {
      const raw = ph.isFeatureEnabled(flagKey);
      const value = (typeof raw === 'boolean' ? raw : defaultValue) as T;
      return { value, ready };
    }
    const raw = ph.getFeatureFlag(flagKey);
    const value = (typeof raw === 'string' ? raw : defaultValue) as T;
    return { value, ready };
  } catch {
    return { value: defaultValue, ready };
  }
}
