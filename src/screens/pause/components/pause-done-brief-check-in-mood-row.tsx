import { Pencil } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { MoodIcon } from '@/components/icons/MoodIcon';
import { PAUSE_MOOD_GROUPS, type MoodValue } from '@/features/pause/public-ritual-feel';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export type PauseDoneBriefCheckInMoodRowProps = {
  mood: MoodValue | null;
  onMoodChange: (mood: MoodValue) => void;
  moodEditorOpen: boolean;
  onMoodEditorOpenChange: (open: boolean) => void;
};

/** Brief Done check-in: current feel label + grouped mood grid (Figma / MoodCheck parity). */
export function PauseDoneBriefCheckInMoodRow({
  mood,
  onMoodChange,
  moodEditorOpen,
  onMoodEditorOpenChange,
}: PauseDoneBriefCheckInMoodRowProps) {
  "use memo";
  const { t } = useTranslation();

  const moodLabel = mood != null ? t(`moodCheck.moods.${mood}`, { defaultValue: mood }) : null;

  const selectMood = (value: MoodValue) => {
    onMoodChange(value);
    onMoodEditorOpenChange(false);
  };

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="shrink-0 text-sm font-medium text-muted-foreground">
          {t('pause.brief.done.lastEmotionLabel', { defaultValue: 'Feel' })}
        </span>
        {mood && moodLabel ? (
          <>
            <MoodIcon mood={mood} size={20} className="shrink-0 text-muted-foreground" />
            <span className="truncate text-sm font-medium text-foreground">{moodLabel}</span>
          </>
        ) : (
          <span className="truncate text-sm text-muted-foreground">
            {t('pause.brief.done.pickMood', { defaultValue: 'Tap pencil to choose' })}
          </span>
        )}
      </div>
      <Popover open={moodEditorOpen} onOpenChange={onMoodEditorOpenChange}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
            aria-label={t('pause.brief.done.editMoodAria', { defaultValue: 'Edit emotion' })}
          >
            <Pencil className="h-4 w-4" aria-hidden />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="w-[min(20rem,calc(100vw-2rem))] p-3"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <p className="mb-2 text-center text-xs font-medium text-muted-foreground">
            {t('pause.brief.done.moodPickerTitle', { defaultValue: 'Choose emotion' })}
          </p>
          <div className="space-y-3">
            {PAUSE_MOOD_GROUPS.map((group) => (
              <div key={group.key} className="space-y-1.5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t(`moodCheck.${group.key}`)}
                </p>
                <div className="grid grid-cols-4 gap-1.5">
                  {group.moods.map(({ value, key }) => (
                    <Button
                      key={value}
                      type="button"
                      variant="outline"
                      size="sm"
                      aria-pressed={mood === value}
                      onClick={() => selectMood(value)}
                      className={cn(
                        'flex h-auto flex-col items-center gap-1 border-border/60 py-2 text-[10px] font-medium leading-tight text-foreground transition-colors',
                        mood === value && 'border-primary/70 bg-primary/8',
                      )}
                    >
                      <MoodIcon mood={value} size={18} className="text-muted-foreground" />
                      {t(`moodCheck.moods.${key}`)}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
