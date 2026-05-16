import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { MoodIcon } from '@/components/icons/MoodIcon';

const moodGroups = [
  {
    key: 'highEnergy',
    moods: [
      { value: 'fomo', key: 'fomo' },
      { value: 'excited', key: 'excited' },
      { value: 'greedy', key: 'greedy' },
      { value: 'anxious', key: 'anxious' },
    ],
  },
  {
    key: 'lowEnergy',
    moods: [
      { value: 'calm', key: 'calm' },
      { value: 'detached', key: 'detached' },
      { value: 'uncertain', key: 'uncertain' },
      { value: 'fearful', key: 'fearful' },
    ],
  },
] as const;

const allMoods = [
  ...moodGroups[0].moods,
  ...moodGroups[1].moods,
] as const;

export type MoodValue = (typeof allMoods)[number]['value'];

/** Canonical Feel / Shift / post-pause mood keys (keep aligned with `moodCheck.moods.*`). */
export const PAUSE_MOOD_VALUES: readonly MoodValue[] = allMoods.map((m) => m.value);

interface Props {
  onSelect: (mood: MoodValue) => void;
  onSkip: () => void | Promise<void>;
  /** 'before' = raw entry state, 'after' = post-grounding state */
  variant?: 'before' | 'after';
  /** Hide the heading text (when parent provides its own) */
  hideHeading?: boolean;
}

export function MoodCheck({ onSelect, onSkip, variant = 'before', hideHeading = false }: Props) {
  const { t } = useTranslation();

  const heading = variant === 'after'
    ? t('moodCheck.howAreYouFeelingNow', { defaultValue: 'How are you feeling now?' })
    : t('moodCheck.howAreYouFeeling');

  return (
    <div className="space-y-4">
      {!hideHeading && (
        <div className="space-y-1">
          <p className="text-sm font-mono text-muted-foreground">{heading}</p>
          {variant === 'after' && (
            <p className="text-xs leading-relaxed text-muted-foreground">
              {t('moodCheck.afterDesc', { defaultValue: 'After reflecting and grounding, check in again.' })}
            </p>
          )}
        </div>
      )}
      {moodGroups.map((group) => (
        <div key={group.key} className="space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t(`moodCheck.${group.key}`)}
          </p>
          <div className="grid grid-cols-4 gap-1.5">
            {group.moods.map(({ value, key }) => (
              <Button
                key={value}
                variant="outline"
                size="sm"
                onClick={() => onSelect(value)}
                className="flex h-auto flex-col items-center gap-1 border-border/60 py-2.5 text-[11px] font-medium leading-tight text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                <MoodIcon mood={value} size={20} className="text-muted-foreground" />
                {t(`moodCheck.moods.${key}`)}
              </Button>
            ))}
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={onSkip}
        className="w-full text-center text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
      >
        {t('common.skip')}
      </button>
    </div>
  );
}
