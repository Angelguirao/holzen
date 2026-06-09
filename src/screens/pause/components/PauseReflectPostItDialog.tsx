import { useEffect, useId, useState } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { hapticFeedback } from '@/lib/haptics';

export type PauseReflectPostItDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: string;
  setNote: (value: string) => void;
  saving: boolean;
  commit: (next: string) => void;
};

/** Figma 369:7967 — modal post-it editor (not inline in the reflect card). */
export function PauseReflectPostItDialog({
  open,
  onOpenChange,
  note,
  setNote,
  saving,
  commit,
}: PauseReflectPostItDialogProps) {
  "use memo";
  const { t } = useTranslation();
  const [draft, setDraft] = useState(note);
  const noteFieldId = useId();
  const isEditing = note.trim().length > 0;

  useEffect(() => {
    if (open) setDraft(note);
  }, [open, note]);

  const handleSave = () => {
    hapticFeedback('light');
    setNote(draft);
    commit(draft);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="z-[200] max-w-[calc(100%-2rem)] gap-6 rounded-lg border-2 border-primary bg-background p-6 sm:max-w-[374px] [&>button.absolute]:hidden"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          document.getElementById(noteFieldId)?.focus();
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <DialogTitle className="text-left text-2xl font-normal leading-8 tracking-normal">
            {isEditing
              ? t('pause.reflect.editPostIt', { defaultValue: 'Edit your post-it' })
              : t('pause.reflect.addPostIt', { defaultValue: 'Add your post-it' })}
          </DialogTitle>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            aria-label={t('common.close', { defaultValue: 'Close' })}
          >
            <X className="h-5 w-5" aria-hidden />
          </Button>
        </div>

        <DialogDescription className="text-left text-base leading-6 text-foreground">
          {t('pause.reflect.postItDialogBody', { defaultValue: 'Write something to remember.' })}
        </DialogDescription>

        <textarea
          id={noteFieldId}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={t('pause.reflect.postItDialogPlaceholder', {
            defaultValue: 'Your reflection within the reflection...',
          })}
          className="min-h-[120px] w-full resize-y rounded-lg border border-border/80 bg-background px-3 py-3 text-base leading-6 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          disabled={saving}
        />

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="secondary"
            className="rounded-xl bg-primary/10 px-4 py-3 font-medium text-primary shadow-none hover:bg-primary/15"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            {t('common.cancel', { defaultValue: 'Cancel' })}
          </Button>
          <Button
            type="button"
            className="rounded-xl px-4 py-3 font-medium"
            onClick={handleSave}
            disabled={saving}
          >
            {t('common.save', { defaultValue: 'Save' })}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
