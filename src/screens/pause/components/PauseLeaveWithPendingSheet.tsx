import { getPendingPauseOfferDisplay } from '@/features/pause/public';
import type { PendingPauseOfferRow } from '@/features/pause/public-hooks';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useTranslation } from 'react-i18next';

export interface PauseLeaveWithPendingSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pending: PendingPauseOfferRow | null;
  busy: boolean;
  onStay: () => void;
  onLeave: () => void;
  onSwitchToBrief: () => void;
  onAdoptNew: () => void;
  /** Clears the queued pending pause (same product intent as the old “Keep current pause”). */
  onDismissPendingOffer: () => void;
}

/**
 * Bottom sheet when the user closes `/pause` while a `pending` pause is queued
 * (wireframe: Stay / Leave / switch to brief / switch to new pause).
 */
export function PauseLeaveWithPendingSheet({
  open,
  onOpenChange,
  pending,
  busy,
  onStay,
  onLeave,
  onSwitchToBrief,
  onAdoptNew,
  onDismissPendingOffer,
}: PauseLeaveWithPendingSheetProps) {
  const { t } = useTranslation();

  const { contextText, previewMessage, showPreviewLine } = getPendingPauseOfferDisplay(pending);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="z-[200] max-h-[90vh] overflow-y-auto rounded-t-2xl border-t p-6 sm:p-8">
        <SheetHeader className="space-y-1 text-left">
          <SheetTitle className="text-base font-semibold">
            {t('pause.leaveWithPending.sheetTitle', { defaultValue: 'Leave the pause' })}
          </SheetTitle>
          <p className="text-sm font-medium text-foreground">
            {t('pause.leaveWithPending.heading', { defaultValue: 'Leave this pause?' })}
          </p>
        </SheetHeader>
        <div className="mt-4 space-y-3 text-left text-sm text-muted-foreground">
          <p>
            {t('pause.leaveWithPending.body', {
              defaultValue:
                'A new pause is ready for the latest move. You can stay in this ritual, leave this screen, switch to a short brief pause, or open the new pause.',
            })}
          </p>
          {contextText ? (
            <p className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-xs text-foreground/90">{contextText}</p>
          ) : null}
          {showPreviewLine && previewMessage ? (
            <p className="line-clamp-4 text-xs leading-relaxed text-foreground/85">{previewMessage}</p>
          ) : null}
        </div>
        <div className="mt-6 flex flex-col gap-2">
          <Button type="button" disabled={busy} className="w-full" onClick={onStay}>
            {t('pause.leaveWithPending.stayCta', { defaultValue: 'Stay' })}
          </Button>
          <Button type="button" variant="outline" disabled={busy} className="w-full" onClick={onLeave}>
            {t('pause.leaveWithPending.leaveCta', { defaultValue: 'Leave' })}
          </Button>
          <Button type="button" variant="ghost" disabled={busy} className="w-full text-muted-foreground" onClick={onSwitchToBrief}>
            {t('pause.leaveWithPending.switchBriefCta', {
              defaultValue: 'Or switch to brief pause (~2 min)',
            })}
          </Button>
          <Button type="button" variant="secondary" disabled={busy || !pending} className="w-full" onClick={onAdoptNew}>
            {t('pause.pendingAdoptCta', { defaultValue: 'Switch to new pause' })}
          </Button>
          <Button
            type="button"
            variant="link"
            disabled={busy || !pending}
            className="w-full text-xs text-muted-foreground"
            onClick={onDismissPendingOffer}
          >
            {t('pause.pendingKeepCta', { defaultValue: 'Keep current pause' })}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
