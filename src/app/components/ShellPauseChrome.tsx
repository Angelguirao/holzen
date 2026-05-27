import { useLocation } from 'react-router-dom';
import { PauseReadyBanner } from '@/app/components/PauseReadyBanner';

type Props = {
  pauseReady: boolean;
  onDismissPauseReady: () => void;
};

/**
 * Cross-tab pause chrome mounted from `AppLayout`: auto-trigger banner (off Home).
 * Pending market context is handled inline on the Home widget (B / C′), not a blocking modal.
 */
export function ShellPauseChrome({ pauseReady, onDismissPauseReady }: Props) {
  const location = useLocation();
  const isHome = location.pathname === '/' || location.pathname === '/index';

  if (isHome) return null;

  return <PauseReadyBanner visible={pauseReady} onDismiss={onDismissPauseReady} />;
}
