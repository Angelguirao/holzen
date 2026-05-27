import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil } from 'lucide-react';
import { usePauseReflectNote } from '@/features/pause/public-ritual-reflect';

interface Props {
  pauseInstanceId: string;
}

/**
 * V2 note editor — logs a note_updated step event via the RPC.
 * Initial text is hydrated from the latest note_updated event on
 * this instance.
 */
export function PauseNote({ pauseInstanceId }: Props) {
  "use memo";
  const { t } = useTranslation();
  const { note, setNote, saving, commitOnBlur } = usePauseReflectNote(pauseInstanceId);
  const noteFieldId = useId();
  const noteLabelId = useId();
  const noteLabel = t('pause.reflect.noteLabel', { defaultValue: 'Your note' });

  return (
    <div className="space-y-1.5">
      <label
        id={noteLabelId}
        htmlFor={noteFieldId}
        className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
      >
        <Pencil className="h-3 w-3" aria-hidden />
        {noteLabel}
      </label>
      <textarea
        id={noteFieldId}
        aria-labelledby={noteLabelId}
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
