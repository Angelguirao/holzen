import type { TFunction } from 'i18next';
import { toast } from '@/components/ui/sonner';

/** Figma 579:32066 — brief undo window before `pause_dismiss_current`. */
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

  toast.message(input.t('home.pauseWidget.discardSnackbar', { defaultValue: 'Pause discarded.' }), {
    id: DISCARD_TOAST_ID,
    duration: HOME_PAUSE_DISCARD_UNDO_MS,
    classNames: {
      toast:
        'border-border/60 bg-[#eaffe8] text-foreground group-[.toaster]:bg-[#eaffe8] group-[.toaster]:text-foreground',
    },
    action: {
      label: input.t('home.pauseWidget.discardUndo', { defaultValue: 'Undo' }),
      onClick: undo,
    },
    onDismiss: () => {
      window.clearTimeout(timer);
      commit();
    },
  });
}
