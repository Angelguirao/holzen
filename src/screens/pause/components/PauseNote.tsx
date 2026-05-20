import { useTranslation } from 'react-i18next';
import { Pencil } from 'lucide-react';
import { usePauseReflectNote } from '@/features/pause/public-hooks';

interface Props {
  pauseInstanceId: string;
}

/**
 * V2 note editor — logs a note_updated step event via the RPC.
 * Initial text is hydrated from the latest note_updated event on
 * this instance.
 */
export function PauseNote({ pauseInstanceId }: Props) {
  const { t } = useTranslation();
  const { note, setNote, saving, commitOnBlur } = usePauseReflectNote(pauseInstanceId);

  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Pencil className="h-3 w-3" aria-hidden />
        {t('pause.reflect.noteLabel', { defaultValue: 'Your note' })}
      </label>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onBlur={commitOnBlur}
        placeholder={t('pause.reflect.notePlaceholder', {
          defaultValue: 'What felt important? What would you tell yourself tomorrow?',
        })}
        className="min-h-20 w-full resize-y rounded-md border border-border/60 bg-muted/30 p-2 text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-ring"
        disabled={saving}
      />
    </div>
  );
}
