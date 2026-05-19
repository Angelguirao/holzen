import { useLocation } from 'react-router-dom';
import { PauseReadyBanner } from '@/app/components/PauseReadyBanner';
import { PendingPauseOfferShell } from '@/screens/pause/components/PendingPauseOfferShell';
import { useHolzen } from '@/screens/home/hooks/use-holzen';

type Props = {
  pauseReady: boolean;
  onDismissPauseReady: () => void;
};

/**
 * Cross-tab pause chrome mounted from `AppLayout`: pending-offer modal,
 * auto-trigger banner (off Home), and open-pause resync after adopt/decline.
 *
 * Uses `useHolzen` only here so the rest of the shell stays profile/layout-focused.
 * `pauseReady` / `onDismissPauseReady` come from `useAutoTrigger` in `AppLayout`
 * (shared with Home via router outlet context).
 */
export function ShellPauseChrome({ pauseReady, onDismissPauseReady }: Props) {
  const { resyncOpenPauseFromDb } = useHolzen();
  const location = useLocation();
  const isHome = location.pathname === '/' || location.pathname === '/index';

  return (
    <>
      <PendingPauseOfferShell
        onAfterMutation={() => void resyncOpenPauseFromDb()}
        autoOpen={location.pathname !== '/pause'}
      />
      {!isHome && <PauseReadyBanner visible={pauseReady} onDismiss={onDismissPauseReady} />}
    </>
  );
}
