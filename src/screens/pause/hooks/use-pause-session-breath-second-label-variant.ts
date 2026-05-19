import { useFeatureFlag } from '@/hooks/use-feature-flag';
import {
  resolvePauseBreathSecondLabelVariant,
  type PauseBreathSecondLabelVariant,
  viteWantsPauseBreathSecondLabelShift,
} from '@/features/pause/public';

/** PostHog `pause.step5_breath_label_shift` + optional Vite override → scaffold breath label variant. */
export function usePauseSessionBreathSecondLabelVariant(): PauseBreathSecondLabelVariant {
  const { value: step5BreathLabelRaw, ready: step5FlagReady } = useFeatureFlag(
    'pause.step5_breath_label_shift',
    false,
  );
  return resolvePauseBreathSecondLabelVariant({
    viteWantsShift: viteWantsPauseBreathSecondLabelShift(
      import.meta.env.VITE_PAUSE_STEP5_BREATH_LABEL_SHIFT as string | undefined,
    ),
    flagReady: step5FlagReady,
    posthogRaw: step5BreathLabelRaw,
  });
}
