import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { MoodIcon } from '@/components/icons/MoodIcon';
import {
  PAUSE_MOOD_GROUPS,
  type MoodValue,
} from '@/features/pause/public-ritual-feel';
import { hapticFeedback } from '@/lib/haptics';
import { cn } from '@/lib/utils';

export interface PauseFrameShiftMoodProps {
  selectedShiftMood: MoodValue | null;
  onSelectShiftMood: (mood: MoodValue) => void;
}

/** Optional Frame check-in — logs `shift_emotion_logged` with mood for Presence XP bonus. */
export function PauseFrameShiftMood({
  selectedShiftMood,
  onSelectShiftMood,
}: PauseFrameShiftMoodProps) {
  "use memo";
  const { t } = useTranslation();

  return (
    <div className="mt-8 w-full space-y-3 text-left">
      <div className="space-y-1 text-center">
        <p className="text-sm font-mono text-muted-foreground">
          {t('pause.frame.shiftMoodTitle', { defaultValue: 'How are you feeling now?' })}
        </p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {t('pause.frame.shiftMoodHint', {
            defaultValue: 'Optional — tap a mood if something shifted after companions.',
          })}
        </p>
      </div>
      {PAUSE_MOOD_GROUPS.map((group) => (
        <div key={group.key} className="space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t(`moodCheck.${group.key}`)}
          </p>
          <div className="grid grid-cols-4 gap-1.5">
            {group.moods.map(({ value, key }) => {
              const selected = selectedShiftMood === value;
              return (
                <Button
                  key={value}
                  type="button"
                  variant="outline"
                  size="sm"
                  aria-pressed={selected}
                  onClick={() => {
                    hapticFeedback('light');
                    onSelectShiftMood(value);
                  }}
                  className={cn(
                    'flex h-auto flex-col items-center gap-1 border-border/60 py-2.5 text-[11px] font-medium leading-tight text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5',
                    selected && 'border-primary/50 bg-primary/10',
                  )}
                >
                  <MoodIcon mood={value} size={20} className="text-muted-foreground" />
                  {t(`moodCheck.moods.${key}`)}
                </Button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
