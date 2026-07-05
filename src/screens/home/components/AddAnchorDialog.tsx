import { useCallback, useEffect, useState, useTransition } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ANCHOR_MANTRA_MAX_LENGTH } from '@/features/user/public';

interface AddAnchorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValue?: string;
  onSave: (mantra: string) => Promise<void>;
}

export function AddAnchorDialog({ open, onOpenChange, initialValue = '', onSave }: AddAnchorDialogProps) {
  "use memo";
  const { t } = useTranslation();
  const [draft, setDraft] = useState(initialValue);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (open) setDraft(initialValue);
  }, [open, initialValue]);

  const trimmed = draft.trim();
  const canSave = trimmed.length > 0 && trimmed.length <= ANCHOR_MANTRA_MAX_LENGTH;

  const handleSave = useCallback(() => {
    if (!canSave) return;
    startTransition(async () => {
      try {
        await onSave(trimmed);
        toast.success(t('home.goalWhy.anchorAdded', { defaultValue: 'Anchor added' }));
        onOpenChange(false);
      } catch {
        /* profile write surfaces its own toast */
      }
    });
  }, [canSave, onOpenChange, onSave, startTransition, t, trimmed]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2.5rem)] gap-0 rounded-lg p-6 sm:max-w-md [&>button]:hidden">
        <DialogHeader className="space-y-3 text-left">
          <div className="flex items-start justify-between gap-3">
            <DialogTitle className="text-base font-medium leading-8">
              {t('home.goalWhy.addAnchorTitle', { defaultValue: 'Add your anchor' })}
            </DialogTitle>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="inline-flex h-6 w-6 shrink-0 items-center justify-center text-muted-foreground"
              aria-label={t('common.close', { defaultValue: 'Close' })}
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
          <DialogDescription className="text-sm leading-6 text-foreground">
            {t('home.goalWhy.addAnchorDesc', {
              defaultValue: "A line you'd come back to. In your own words.",
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, ANCHOR_MANTRA_MAX_LENGTH))}
            rows={4}
            className="min-h-24 resize-none text-base"
            aria-label={t('home.goalWhy.addAnchorTitle', { defaultValue: 'Add your anchor' })}
          />
          <p className="text-right text-xs text-muted-foreground">
            {draft.length}/{ANCHOR_MANTRA_MAX_LENGTH}
          </p>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel', { defaultValue: 'Cancel' })}
          </Button>
          <Button type="button" disabled={!canSave || isPending} onClick={handleSave}>
            {t('common.save', { defaultValue: 'Save' })}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
