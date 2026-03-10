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

interface Props {
  onSelect: (mood: MoodValue) => void;
  onSkip: () => void;
  /** 'before' = raw entry state, 'after' = post-grounding state */
  variant?: 'before' | 'after';
}

export function MoodCheck({ onSelect, onSkip, variant = 'before' }: Props) {
  const { t } = useTranslation();

  const heading = variant === 'after'
    ? t('moodCheck.howAreYouFeelingNow', 'How are you feeling now?')
    : t('moodCheck.howAreYouFeeling');

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <p className="text-sm font-mono text-muted-foreground">{heading}</p>
        {variant === 'after' && (
          <p className="text-[10px] text-muted-foreground/40 font-mono">
            {t('moodCheck.afterDesc', 'After reflecting and grounding, check in again.')}
          </p>
        )}
      </div>
      {moodGroups.map((group) => (
        <div key={group.key} className="space-y-1.5">
          <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground/50">
            {t(`moodCheck.${group.key}`)}
          </p>
          <div className="grid grid-cols-4 gap-1.5">
            {group.moods.map(({ value, key }) => (
              <Button
                key={value}
                variant="outline"
                size="sm"
                onClick={() => onSelect(value)}
                className="flex flex-col items-center gap-0.5 h-auto py-2.5 text-[10px] font-mono border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-colors"
              >
                <MoodIcon mood={value} size={18} className="text-muted-foreground" />
                {t(`moodCheck.moods.${key}`)}
              </Button>
            ))}
          </div>
        </div>
      ))}
      <button
        onClick={onSkip}
        className="text-[10px] font-mono text-muted-foreground/60 underline w-full text-center"
      >
        {t('common.skip')}
      </button>
    </div>
  );
}
