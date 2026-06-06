import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import {
  ANCHOR_MANTRA_MAX_LENGTH,
  hasMinimumMotivations,
} from '@/features/user/domain/profile-motivations';
import { MotivationPickerGrid } from '@/features/user/presentation/MotivationPickerGrid';
import { cn } from '@/lib/utils';

interface GoalWhyEditSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mantra: string | null;
  motivations: string[];
  onSave: (next: { mantra: string | null; motivations: string[] }) => Promise<void>;
}

function arraysEqual(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((value, index) => value === sortedB[index]);
}

export function GoalWhyEditSheet({
  open,
  onOpenChange,
  mantra,
  motivations,
  onSave,
}: GoalWhyEditSheetProps) {
  "use memo";
  const { t } = useTranslation();
  const [draftMantra, setDraftMantra] = useState(mantra ?? '');
  const [draftMotivations, setDraftMotivations] = useState<string[]>([...motivations]);
  const [showMinimumError, setShowMinimumError] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDraftMantra(mantra ?? '');
    setDraftMotivations([...motivations]);
    setShowMinimumError(false);
  }, [open, mantra, motivations]);

  const trimmedMantra = draftMantra.trim();
  const normalizedMantra = trimmedMantra.length > 0 ? trimmedMantra : null;

  const isDirty = useMemo(() => {
    const mantraChanged = (mantra ?? '') !== (normalizedMantra ?? '');
    const motivationsChanged = !arraysEqual(motivations, draftMotivations);
    return mantraChanged || motivationsChanged;
  }, [draftMotivations, mantra, motivations, normalizedMantra]);

  const canSave = isDirty && hasMinimumMotivations(draftMotivations);

  const handleSave = useCallback(async () => {
    if (!hasMinimumMotivations(draftMotivations)) {
      setShowMinimumError(true);
      return;
    }
    if (!isDirty) return;

    setSaving(true);
    try {
      await onSave({ mantra: normalizedMantra, motivations: draftMotivations });
      onOpenChange(false);
    } catch {
      /* profile write surfaces its own toast */
    } finally {
      setSaving(false);
    }
  }, [draftMotivations, isDirty, normalizedMantra, onOpenChange, onSave]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="flex h-[100dvh] max-h-[100dvh] flex-col gap-0 rounded-none border-0 p-0 [&>button]:hidden"
      >
        <SheetTitle className="sr-only">
          {t('home.goalWhy.editTitle', { defaultValue: 'Edit anchor and whys' })}
        </SheetTitle>

        <div className="flex shrink-0 items-center justify-between px-8 pb-2.5 pt-10">
          <p className="w-full text-center text-sm font-medium text-foreground">
            {t('home.goalWhy.editTitleShort', { defaultValue: 'Edit' })}
          </p>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute right-8 top-10 inline-flex h-6 w-6 items-center justify-center text-muted-foreground"
            aria-label={t('common.close', { defaultValue: 'Close' })}
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-9 pb-28 pt-4">
          <div className="space-y-6">
            <section className="space-y-4">
              <div className="space-y-2">
                <h2 className="text-base font-medium text-foreground">
                  {t('home.goalWhy.anchorHeading', { defaultValue: 'Your anchor' })}
                </h2>
                <p className="text-sm text-foreground">
                  {t('home.goalWhy.anchorHint', { defaultValue: "A line you'd come back to." })}
                </p>
              </div>
              <div className="space-y-2">
                <Textarea
                  value={draftMantra}
                  onChange={(e) => setDraftMantra(e.target.value.slice(0, ANCHOR_MANTRA_MAX_LENGTH))}
                  rows={4}
                  className="min-h-24 resize-none text-base"
                  aria-label={t('home.goalWhy.anchorHeading', { defaultValue: 'Your anchor' })}
                />
                <p className="text-right text-xs text-muted-foreground">
                  {draftMantra.length}/{ANCHOR_MANTRA_MAX_LENGTH}
                </p>
              </div>
            </section>

            <section className="space-y-4">
              <div className="space-y-2">
                <h2 className="text-base font-medium text-foreground">
                  {t('home.goalWhy.whyHeading', { defaultValue: 'Your Why' })}
                </h2>
                <p className="text-sm text-foreground">
                  {t('home.goalWhy.whyHint', { defaultValue: "Why you're here. Your motives." })}
                </p>
              </div>
              <MotivationPickerGrid
                selected={draftMotivations}
                onChange={(next) => {
                  setDraftMotivations(next);
                  if (hasMinimumMotivations(next)) setShowMinimumError(false);
                }}
                showMinimumError={showMinimumError}
              />
            </section>
          </div>
        </div>

        <div className="shrink-0 border-t border-border/40 bg-background px-4 pb-6 pt-4">
          <Button
            type="button"
            disabled={!canSave || saving}
            onClick={() => void handleSave()}
            className={cn(
              'h-[52px] w-full rounded-full text-sm font-medium',
              canSave ? 'bg-primary text-primary-foreground' : 'bg-muted-foreground/40 text-white',
            )}
          >
            {t('common.save', { defaultValue: 'Save' })}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
