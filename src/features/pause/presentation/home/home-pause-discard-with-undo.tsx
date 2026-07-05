import type { TFunction } from 'i18next';
import { Info, X } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

/** Figma 435:19719 — brief undo window before `pause_dismiss_current`. */
export const HOME_PAUSE_DISCARD_UNDO_MS = 8_000;

const DISCARD_TOAST_ID = 'home-pause-discard-undo';

export function showHomePauseDiscardUndoToast(input: {
  t: TFunction;
  onUndo: () => void;
  onCommit: () => void;
}): void {
  let settled = false;

  const commit = () => {
    if (settled) return;
    settled = true;
    input.onCommit();
  };

  const undo = () => {
    if (settled) return;
    settled = true;
    toast.dismiss(DISCARD_TOAST_ID);
    input.onUndo();
  };

  const timer = window.setTimeout(commit, HOME_PAUSE_DISCARD_UNDO_MS);

  toast.custom(
    () => (
      <div
        role="status"
        className="flex w-full max-w-md items-center gap-4 rounded-xl border border-border/60 bg-muted px-4 py-3 text-foreground shadow-lg"
      >
        <div className="flex min-w-0 flex-1 items-center gap-6">
          <Info className="h-5 w-5 shrink-0 text-foreground" aria-hidden />
          <p className="text-base leading-6">
            {input.t('home.pauseWidget.discardSnackbar', { defaultValue: 'Pause discarded' })}
          </p>
          <button
            type="button"
            onClick={undo}
            className="shrink-0 text-base leading-6 text-foreground underline underline-offset-2"
          >
            {input.t('home.pauseWidget.discardUndo', { defaultValue: 'Undo' })}
          </button>
        </div>
        <button
          type="button"
          onClick={() => toast.dismiss(DISCARD_TOAST_ID)}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-background/60 hover:text-foreground"
          aria-label={input.t('common.close', { defaultValue: 'Close' })}
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>
    ),
    {
      id: DISCARD_TOAST_ID,
      duration: HOME_PAUSE_DISCARD_UNDO_MS,
      onDismiss: () => {
        window.clearTimeout(timer);
        commit();
      },
    },
  );
}
