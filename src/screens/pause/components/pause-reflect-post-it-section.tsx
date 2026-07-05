import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CirclePlus } from 'lucide-react';
import { PauseReflectPostItDialog } from '@/screens/pause/components/PauseReflectPostItDialog';
import { PausePersonalNoteSurface } from '@/screens/pause/components/pause-personal-note-surface';
import { usePauseReflectNote, usePauseReflectUiTelemetry } from '@/features/pause/public-ritual-reflect';
import { Button } from '@/components/ui/button';
import { hapticFeedback } from '@/lib/haptics';

export type PauseReflectPostItSectionProps = {
  pauseInstanceId: string;
};

/** Pro reflect: post-it pill or saved note inside the letter card (Wireframes 369:7882). */
export function PauseReflectPostItSection({ pauseInstanceId }: PauseReflectPostItSectionProps) {
  "use memo";
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const { onPostItOpen } = usePauseReflectUiTelemetry(pauseInstanceId, 'pause_reflect');
  const { note, setNote, saving, commit } = usePauseReflectNote(pauseInstanceId);
  const hasNote = note.trim().length > 0;

  const openDialog = useCallback(() => {
    hapticFeedback('light');
    setDialogOpen(true);
    onPostItOpen();
  }, [onPostItOpen]);

  return (
    <div className="w-full min-w-0">
      {hasNote ? (
        <PausePersonalNoteSurface variant="post-it" body={note} onChange={openDialog} />
      ) : (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="self-start rounded-full bg-primary/10 px-4 py-2.5 font-medium text-primary shadow-none hover:bg-primary/15"
          onClick={openDialog}
        >
          <CirclePlus className="mr-1.5 h-5 w-5" aria-hidden />
          {t('pause.reflect.addPostIt', { defaultValue: 'Add your post-it' })}
        </Button>
      )}
      <PauseReflectPostItDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        note={note}
        setNote={setNote}
        saving={saving}
        commit={commit}
      />
    </div>
  );
}
