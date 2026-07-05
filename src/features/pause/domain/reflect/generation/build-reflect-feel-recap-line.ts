import type { TFunction } from 'i18next';
import type { CurrentFeelForReflect } from '@/features/pause/domain/reflect/generation/reflection-content-v2';

function moodDisplayLabel(mood: string, t: TFunction): string {
  const key = `moodCheck.moods.${mood}`;
  const translated = t(key, { defaultValue: '' });
  if (translated && translated !== key) return translated;
  return mood.charAt(0).toUpperCase() + mood.slice(1);
}

/** Muted Feel recap shown above the reflection letter (not inside LLM copy). */
export function buildReflectFeelRecapLine(
  currentFeel: CurrentFeelForReflect | undefined,
  t: TFunction,
): string | null {
  const mood = currentFeel?.mood?.trim();
  if (!mood) return null;

  const intensity = currentFeel?.intensity;
  const tileLabel = currentFeel?.tileLabel?.trim();

  const moodLabel = moodDisplayLabel(mood, t);
  const base =
    typeof intensity === 'number'
      ? t('pause.reflect.feelRecap', {
          defaultValue: 'You said: {{mood}} ({{intensity}}/5)',
          mood: moodLabel,
          intensity,
        })
      : t('pause.reflect.feelRecapNoIntensity', {
          defaultValue: 'You said: {{mood}}',
          mood: moodLabel,
        });

  if (tileLabel) {
    return `${base} — ${t('pause.reflect.feelTile', { defaultValue: '“{{tile}}”', tile: tileLabel })}`;
  }
  return base;
}
