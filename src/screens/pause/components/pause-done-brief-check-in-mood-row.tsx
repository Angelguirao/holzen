import { Pencil } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PAUSE_MOOD_VALUES } from '@/screens/pause/components/MoodCheck';
import { MoodIcon } from '@/components/icons/MoodIcon';
import type { MoodValue } from '@/features/pause/public-hooks';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export type PauseDoneBriefCheckInMoodRowProps = {
  mood: MoodValue | null;
  onMoodChange: (mood: MoodValue) => void;
  moodEditorOpen: boolean;
  onMoodEditorOpenChange: (open: boolean) => void;
};

/** Brief Done check-in: current feel label + popover mood grid. */
export function PauseDoneBriefCheckInMoodRow({
  mood,
  onMoodChange,
  moodEditorOpen,
  onMoodEditorOpenChange,
}: PauseDoneBriefCheckInMoodRowProps) {
  const { t } = useTranslation();

  const moodLabel = mood != null ? t(`moodCheck.moods.${mood}`, { defaultValue: mood }) : null;

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
          <div className="grid grid-cols-4 gap-1.5">
            {PAUSE_MOOD_VALUES.map((value) => (
              <Button
                key={value}
                type="button"
                variant="outline"
                size="sm"
                aria-pressed={mood === value}
                onClick={() => {
                  onMoodChange(value);
                  onMoodEditorOpenChange(false);
                }}
                className={cn(
                  'flex h-auto flex-col items-center gap-1 border-border/60 py-2 text-[10px] font-medium leading-tight text-foreground transition-colors',
                  mood === value && 'border-primary/70 bg-primary/8',
                )}
              >
                <MoodIcon mood={value} size={18} className="text-muted-foreground" />
                {t(`moodCheck.moods.${value}`, { defaultValue: value })}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
