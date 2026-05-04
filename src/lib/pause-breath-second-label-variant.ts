/**
 * Second deep-breath macro label: default "Breathe" vs experiment "Shift"
 * (`pause.step5_breath_label_shift` + optional Vite override).
 */

export type PauseBreathSecondLabelVariant = 'breathe' | 'shift';

/** Vite-only override. Treats `1`, `true`, and `shift` as enabled. */
export function viteWantsPauseBreathSecondLabelShift(viteValue: string | undefined): boolean {
  return viteValue === '1' || viteValue === 'true' || viteValue === 'shift';
}

export function resolvePauseBreathSecondLabelVariant(input: {
  viteWantsShift: boolean;
  flagReady: boolean;
  /** PostHog `pause.step5_breath_label_shift` payload */
  posthogRaw: unknown;
}): PauseBreathSecondLabelVariant {
  const { viteWantsShift, flagReady, posthogRaw } = input;
  if (viteWantsShift) return 'shift';
  if (flagReady && (posthogRaw === true || posthogRaw === 'shift')) return 'shift';
  return 'breathe';
}
