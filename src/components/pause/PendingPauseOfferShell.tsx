import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
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
import { usePendingPauseOffer } from '@/hooks/use-pending-pause-offer';
import { pauseAdoptPendingOffer, pauseDeclinePendingOffer } from '@/lib/pause-api';
import { trackEvent } from '@/lib/posthog';

interface Props {
  /** After adopt or decline — e.g. resync `useHolzen` from `v_pause_current`. */
  onAfterMutation: () => void | Promise<void>;
  /** Optional: e.g. reset `/pause` client state to the newly active instance. */
  navigateAfterAdopt?: (instanceId: string) => void;
}

/**
 * Blocking modal when the server has queued a `pending` pause (new market
 * context) while the user still has an active ritual.
 */
export function PendingPauseOfferShell({ onAfterMutation, navigateAfterAdopt }: Props) {
  const { t } = useTranslation();
  const { pending, refresh } = usePendingPauseOffer();
  const [busy, setBusy] = useState(false);

  const open = !!pending;

  const handleAdopt = async () => {
    if (!pending || busy) return;
    setBusy(true);
    try {
      const r = await pauseAdoptPendingOffer();
      if (!r.ok || !r.instance_id) {
        toast.error(t('pause.pendingAdoptFailed', { defaultValue: 'Could not switch to the new pause. Try again.' }));
        return;
      }
      try {
        trackEvent('pause_pending_adopted', { pause_instance_id: r.instance_id });
      } catch {
        /* no-op */
      }
      await Promise.resolve(onAfterMutation());
      navigateAfterAdopt?.(r.instance_id);
      await refresh();
    } catch {
      toast.error(t('pause.pendingAdoptFailed', { defaultValue: 'Could not switch to the new pause. Try again.' }));
    } finally {
      setBusy(false);
    }
  };

  const handleDecline = async () => {
    if (!pending || busy) return;
    setBusy(true);
    try {
      await pauseDeclinePendingOffer();
      try {
        trackEvent('pause_pending_declined', { pause_instance_id: pending.id });
      } catch {
        /* no-op */
      }
      await Promise.resolve(onAfterMutation());
      await refresh();
    } catch {
      toast.error(t('pause.pendingDeclineFailed', { defaultValue: 'Could not dismiss the offer. Try again.' }));
    } finally {
      setBusy(false);
    }
  };

  const preview = pending?.preview_message?.trim();
  const ctx =
    pending?.context_snapshot && typeof pending.context_snapshot.context_text === 'string'
      ? (pending.context_snapshot.context_text as string)
      : null;

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
              {ctx ? (
                <p className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-xs text-foreground/90">
                  {ctx}
                </p>
              ) : null}
              {preview ? (
                <p className="line-clamp-4 text-xs leading-relaxed text-foreground/85">{preview}</p>
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
