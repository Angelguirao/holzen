import { useTranslation } from 'react-i18next';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { getPendingPauseOfferDisplay } from '@/features/pause/public';
import { usePendingPauseOffer, usePendingPauseOfferMutations } from '@/features/pause/public-hooks';

interface Props {
  /** After adopt or decline — e.g. resync `useHolzen` from `v_pause_current`. */
  onAfterMutation: () => void | Promise<void>;
  /** Optional: e.g. reset `/pause` client state to the newly active instance. */
  navigateAfterAdopt?: (instanceId: string) => void;
  /**
   * When `false`, this instance never opens the dialog (`/pause` uses
   * `PauseLeaveWithPendingSheet` instead). Default: blocking modal when `pending` exists.
   */
  autoOpen?: boolean;
}

/**
 * Blocking modal when the server has queued a `pending` pause (new market
 * context) while the user still has an active ritual.
 */
export function PendingPauseOfferShell({ onAfterMutation, navigateAfterAdopt, autoOpen = true }: Props) {
  const { t } = useTranslation();
  const { pending, refresh } = usePendingPauseOffer();
  const { busy, handleAdopt, handleDecline } = usePendingPauseOfferMutations({
    pending,
    onAfterMutation,
    navigateAfterAdopt,
    refreshPendingOffer: refresh,
    t,
  });

  const open = autoOpen && !!pending;
  const { contextText, previewMessage, showPreviewLine } = getPendingPauseOfferDisplay(pending);

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="z-[200] sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t('pause.pendingContextTitle', { defaultValue: 'Market context changed' })}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-left text-sm text-muted-foreground">
              <p>
                {t('pause.pendingContextBody', {
                  defaultValue:
                    'There is a new pause for the latest move. You can keep your current pause or switch — switching ends the current ritual for this moment and opens the new one.',
                })}
              </p>
              {contextText ? (
                <p className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-xs text-foreground/90">
                  {contextText}
                </p>
              ) : null}
              {showPreviewLine && previewMessage ? (
                <p className="line-clamp-4 text-xs leading-relaxed text-foreground/85">{previewMessage}</p>
              ) : null}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <AlertDialogAction type="button" disabled={busy} className="w-full" onClick={() => void handleAdopt()}>
            {t('pause.pendingAdoptCta', { defaultValue: 'Switch to new pause' })}
          </AlertDialogAction>
          <Button type="button" variant="outline" disabled={busy} className="w-full" onClick={() => void handleDecline()}>
            {t('pause.pendingKeepCta', { defaultValue: 'Keep current pause' })}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
