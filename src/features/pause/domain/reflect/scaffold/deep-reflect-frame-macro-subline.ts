import type { TFunction } from 'i18next';
import type { PauseStep } from '@/features/pause/domain/pause-ritual-steps';

/** Deep ritual macro progress subline for Reflect and Frame beats only. */
export function deepReflectOrFrameMacroSubline(
  step: PauseStep,
  t: TFunction,
): string | undefined {
  if (step === 'reflect') {
    return t('pause.deep.reflectStepDurationHint', { defaultValue: '~ 3 min' });
  }
  if (step === 'frame') {
    return t('pause.reflect.subtitle', { defaultValue: 'Take your time' });
  }
  return undefined;
}
