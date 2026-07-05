import type { TFunction } from 'i18next';
import {
  PAUSE_FEEL_INTENSITY_KEYS,
  type PauseFeelIntensityKey,
} from '@/features/pause/domain/pause-feel-intensity';
import { clampFeelIntensity } from '@/features/pause/domain/mood-value';

export function formatPauseDoneMoodLabel(mood: string | null | undefined, t: TFunction): string | null {
  const trimmed = mood?.trim();
  if (!trimmed) return null;
  const key = `moodCheck.moods.${trimmed}`;
  const translated = t(key, { defaultValue: '' });
  if (translated && translated !== key) return translated;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

export function formatPauseDoneIntensityLabel(
  intensity: number | null | undefined,
  t: TFunction,
): string | null {
  const clamped = clampFeelIntensity(intensity ?? null);
  const key = PAUSE_FEEL_INTENSITY_KEYS[clamped - 1] as PauseFeelIntensityKey;
  return t(`pause.feelStep.intensity.${key}`, { defaultValue: key });
}

/** "Fearful · Strong" — mood and intensity on one line. */
export function formatPauseDoneMoodIntensityLine(
  mood: string | null | undefined,
  intensity: number | null | undefined,
  t: TFunction,
): string | null {
  const moodLabel = formatPauseDoneMoodLabel(mood, t);
  const intensityLabel = formatPauseDoneIntensityLabel(intensity, t);
  if (moodLabel && intensityLabel) return `${moodLabel} · ${intensityLabel}`;
  return moodLabel ?? intensityLabel;
}

const DECISION_I18N: Record<string, string> = {
  hold: 'pause.decide.hold',
  buy: 'pause.decide.buy',
  sell: 'pause.decide.sell',
};

export function formatPauseDoneDecisionLabel(decision: string | null | undefined, t: TFunction): string | null {
  const d = decision?.trim().toLowerCase();
  if (!d) return null;
  const key = DECISION_I18N[d];
  if (key) return t(key);
  return d.charAt(0).toUpperCase() + d.slice(1);
}

/** "Fearful · Strong → Faint" when only intensity shifts; full mood line when mood changes too. */
export function formatPauseDoneEndedShiftLine(input: {
  startMood: string | null | undefined;
  startIntensity: number | null | undefined;
  endMood: string | null | undefined;
  endIntensity: number | null | undefined;
  t: TFunction;
}): string | null {
  const start = formatPauseDoneMoodIntensityLine(input.startMood, input.startIntensity, input.t);
  if (!start) return null;

  const endMood = input.endMood?.trim() ?? '';
  const startMood = input.startMood?.trim() ?? '';
  const endIntensityLabel = formatPauseDoneIntensityLabel(input.endIntensity, input.t);
  if (!endIntensityLabel) return null;

  if (endMood && endMood !== startMood) {
    const end = formatPauseDoneMoodIntensityLine(input.endMood, input.endIntensity, input.t);
    return end ? `${start} → ${end}` : null;
  }

  return `${start} → ${endIntensityLabel}`;
}
