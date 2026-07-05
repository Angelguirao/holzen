import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { buildOpenPausePreviewFromPendingOffer } from '@/features/pause/domain/home/build-open-pause-preview-from-pending-offer';
import { showHomePauseDiscardUndoToast } from '@/features/pause/presentation/home/home-pause-discard-with-undo';
import { trackPauseOpenDismissed } from '@/features/pause/presentation/reflect/generation/manual-open/pause-home-reflect-telemetry-io';
import type {
  OpenPauseHomePreviewSnapshot,
  OpenPauseHomePreviewSnapshotSource,
} from '@/features/pause/presentation/home/open-pause-home-preview-snapshot';
import type { PendingPauseOfferRow } from '@/features/pause/presentation/reflect/pending-offer/use-pending-pause-offer';

type DiscardPreviewPorts = {
  lastPauseInstanceId: string | null;
  openPauseState: 'active' | 'engaged' | null;
  pending: PendingPauseOfferRow | null;
  capturePreviewSnapshot: () => OpenPauseHomePreviewSnapshot;
  applyOpenPausePreviewSource: (source: OpenPauseHomePreviewSnapshotSource) => void;
  clearOpenPausePreview: () => void;
  restorePreviewSnapshot: (snapshot: OpenPauseHomePreviewSnapshot) => void;
  commitOpenPauseDismissRpc: () => Promise<void>;
  syncOpenPauseFromDb: () => Promise<void>;
  refreshPendingOffer: () => Promise<void>;
};

/** Home widget **Discard** — optimistic preview + undo toast + RPC commit (C′ promotes pending). */
export function usePauseHomeDiscardFromWidget(ports: DiscardPreviewPorts) {
  const { t } = useTranslation();

  return useCallback(() => {
    const pauseInstanceId = ports.lastPauseInstanceId;
    const snapshot = ports.capturePreviewSnapshot();
    const promotePendingOnDismiss = ports.openPauseState === 'engaged' && ports.pending != null;

    if (promotePendingOnDismiss) {
      ports.applyOpenPausePreviewSource(
        buildOpenPausePreviewFromPendingOffer(ports.pending!),
      );
    } else {
      ports.clearOpenPausePreview();
    }

    showHomePauseDiscardUndoToast({
      t,
      onUndo: () => ports.restorePreviewSnapshot(snapshot),
      onCommit: () => {
        trackPauseOpenDismissed('home_your_pause_widget', pauseInstanceId);
        void (async () => {
          await ports.commitOpenPauseDismissRpc();
          if (promotePendingOnDismiss) {
            await ports.syncOpenPauseFromDb();
            await ports.refreshPendingOffer();
          }
        })();
      },
    });
  }, [ports, t]);
}
