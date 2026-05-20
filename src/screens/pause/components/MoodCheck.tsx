import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { MoodIcon } from '@/components/icons/MoodIcon';
import {
  PAUSE_MOOD_GROUPS,
  PAUSE_MOOD_VALUES,
  type MoodValue,
} from '@/features/pause/public-hooks';

export type { MoodValue } from '@/features/pause/public-hooks';
export { PAUSE_MOOD_VALUES } from '@/features/pause/public-hooks';

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
      {PAUSE_MOOD_GROUPS.map((group) => (
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
